package com.courtmaster.canchas.services;

import com.courtmaster.canchas.dto.DisponibilidadDTO;
import com.courtmaster.canchas.dto.ModificarReservaRequestDTO;
import com.courtmaster.canchas.dto.ReservaRequestDTO;
import com.courtmaster.canchas.dto.ReservaResponseDTO;
import com.courtmaster.canchas.entities.Cancha;
import com.courtmaster.canchas.entities.EstadoReserva;
import com.courtmaster.canchas.entities.Reserva;
import com.courtmaster.canchas.entities.Usuario;
import com.courtmaster.canchas.exceptions.HorarioOcupadoException;
import com.courtmaster.canchas.repositories.CanchaRepository;
import com.courtmaster.canchas.repositories.ReservaRepository;
import com.courtmaster.canchas.repositories.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final CanchaRepository canchaRepository;
    private final UsuarioRepository usuarioRepository;

    // Configuración de horario de operación: 08:00 a 22:00
    private static final LocalTime HORA_APERTURA = LocalTime.of(8, 0);
    private static final LocalTime HORA_CIERRE = LocalTime.of(22, 0);

    /**
     * Paso 1: Genera los bloques horarios de 60 minutos y consulta la BD para calcular la disponibilidad.
     */
    @Transactional(readOnly = true)
    public List<DisponibilidadDTO> obtenerDisponibilidad(Long canchaId, LocalDate fecha) {
        Cancha cancha = canchaRepository.findById(canchaId)
                .orElseThrow(() -> new EntityNotFoundException("Cancha no encontrada con ID: " + canchaId));

        if (!cancha.getActiva()) {
            throw new IllegalStateException("La cancha seleccionada se encuentra inactiva.");
        }

        // Consultamos las reservas ACTIVAS en la BD para la cancha y fecha indicada
        List<Reserva> reservasActivas = reservaRepository.findByCanchaIdAndFechaAndEstado(
                canchaId,
                fecha,
                EstadoReserva.ACTIVA
        );

        // Guardamos las horas de inicio ocupadas en un Set para búsqueda O(1)
        Set<LocalTime> horasOcupadas = reservasActivas.stream()
                .map(Reserva::getHoraInicio)
                .collect(Collectors.toSet());

        List<DisponibilidadDTO> bloques = new ArrayList<>();
        LocalTime slotActual = HORA_APERTURA;

        while (slotActual.isBefore(HORA_CIERRE)) {
            LocalTime finBloque = slotActual.plusHours(1);
            boolean estaOcupado = horasOcupadas.contains(slotActual);

            bloques.add(new DisponibilidadDTO(
                    slotActual,
                    finBloque,
                    !estaOcupado,
                    estaOcupado ? "RESERVADO" : "DISPONIBLE"
            ));

            slotActual = finBloque;
        }

        return bloques;
    }

    /**
     * Paso 2: Motor Transaccional con Bloqueo Pesimista (SELECT ... FOR UPDATE).
     */
    @Transactional
    public ReservaResponseDTO crearReserva(ReservaRequestDTO dto, String userEmail) {
        log.info("Iniciando creación de reserva transaccional para Cancha {} en fecha {} {}",
                dto.canchaId(), dto.fecha(), dto.horaInicio());

        // 1. Bloqueo a nivel de cancha para serializar concurrencia en la misma instalación deportiva
        Cancha cancha = canchaRepository.findByIdWithLock(dto.canchaId())
                .orElseThrow(() -> new EntityNotFoundException("Cancha no encontrada con ID: " + dto.canchaId()));

        if (!cancha.getActiva()) {
            throw new IllegalStateException("No se puede reservar una cancha inactiva.");
        }

        // 2. Ejecutar consulta con bloqueo pesimista exclusivo (SELECT FOR UPDATE)
        Optional<Reserva> reservaExistente = reservaRepository.findReservaActivaConBloqueo(
                cancha.getId(),
                dto.fecha(),
                dto.horaInicio(),
                EstadoReserva.ACTIVA
        );

        // 3. Si la consulta retorna un registro (horario ocupado), lanza 409 Conflict
        if (reservaExistente.isPresent()) {
            log.warn("Conflicto de concurrencia: Horario {} del {} en Cancha {} ya ocupado.",
                    dto.horaInicio(), dto.fecha(), cancha.getId());
            throw new HorarioOcupadoException(
                    "Horario recién ocupado por otro usuario (" + dto.horaInicio() + " - " + dto.fecha() + ")."
            );
        }

        // 4. Determinar el usuario solicitante
        Usuario usuario = resolverUsuario(dto.usuarioId(), userEmail);

        LocalTime horaFin = dto.horaFin() != null ? dto.horaFin() : dto.horaInicio().plusHours(1);

        // 5. Asignar tarifa_base de la Cancha al precio_historico y estado ACTIVA
        Reserva nuevaReserva = Reserva.builder()
                .cancha(cancha)
                .usuario(usuario)
                .fecha(dto.fecha())
                .horaInicio(dto.horaInicio())
                .horaFin(horaFin)
                .estado(EstadoReserva.ACTIVA)
                .precioHistorico(cancha.getTarifaBase())
                .build();

        Reserva guardada = reservaRepository.save(nuevaReserva);
        log.info("Reserva #{} creada exitosamente para usuario {}.", guardada.getId(), usuario.getEmail());

        return ReservaResponseDTO.fromEntity(guardada);
    }

    /**
     * Paso 3: Cancelación de reserva (liberación del horario para futuras consultas).
     */
    @Transactional
    public ReservaResponseDTO cancelarReserva(Long id, String userEmail, boolean esAdmin) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reserva no encontrada con ID: " + id));

        validarPropiedadReserva(reserva, userEmail, esAdmin);

        if (reserva.getEstado() == EstadoReserva.CANCELADA) {
            throw new IllegalArgumentException("La reserva ya se encuentra cancelada.");
        }

        reserva.setEstado(EstadoReserva.CANCELADA);
        Reserva cancelada = reservaRepository.save(reserva);
        log.info("Reserva #{} cancelada exitosamente. Horario liberado.", id);

        return ReservaResponseDTO.fromEntity(cancelada);
    }

    /**
     * Paso 3: Modificación de reserva con revalidación transaccional de concurrencia.
     */
    @Transactional
    public ReservaResponseDTO modificarReserva(Long id, ModificarReservaRequestDTO dto, String userEmail, boolean esAdmin) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reserva no encontrada con ID: " + id));

        validarPropiedadReserva(reserva, userEmail, esAdmin);

        if (reserva.getEstado() == EstadoReserva.CANCELADA) {
            throw new IllegalStateException("No se puede modificar una reserva cancelada.");
        }

        // Bloqueo pesimista en la cancha
        Cancha cancha = canchaRepository.findByIdWithLock(reserva.getCancha().getId())
                .orElseThrow(() -> new EntityNotFoundException("Cancha no encontrada con ID: " + reserva.getCancha().getId()));

        // Validamos con bloqueo pesimista que el nuevo horario no esté tomado por otra reserva ACTIVA
        Optional<Reserva> conflicto = reservaRepository.findReservaActivaConBloqueoExcluyendoId(
                cancha.getId(),
                dto.nuevaFecha(),
                dto.nuevaHoraInicio(),
                EstadoReserva.ACTIVA,
                id
        );

        if (conflicto.isPresent()) {
            throw new HorarioOcupadoException(
                    "El nuevo horario seleccionado (" + dto.nuevaHoraInicio() + ") ya se encuentra ocupado."
            );
        }

        LocalTime nuevaHoraFin = dto.nuevaHoraFin() != null ? dto.nuevaHoraFin() : dto.nuevaHoraInicio().plusHours(1);

        reserva.setFecha(dto.nuevaFecha());
        reserva.setHoraInicio(dto.nuevaHoraInicio());
        reserva.setHoraFin(nuevaHoraFin);
        reserva.setPrecioHistorico(cancha.getTarifaBase());

        Reserva modificada = reservaRepository.save(reserva);
        log.info("Reserva #{} modificada con éxito al nuevo horario {} {}.", id, dto.nuevaFecha(), dto.nuevaHoraInicio());

        return ReservaResponseDTO.fromEntity(modificada);
    }

    @Transactional(readOnly = true)
    public List<ReservaResponseDTO> listarMisReservas(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con email: " + userEmail));

        return reservaRepository.findByUsuarioIdOrderByFechaDescHoraInicioDesc(usuario.getId())
                .stream()
                .map(ReservaResponseDTO::fromEntity)
                .toList();
    }

    private Usuario resolverUsuario(Long usuarioIdDto, String userEmailAuth) {
        if (userEmailAuth != null && !userEmailAuth.isBlank()) {
            return usuarioRepository.findByEmail(userEmailAuth)
                    .orElseThrow(() -> new EntityNotFoundException("Usuario autenticado no encontrado: " + userEmailAuth));
        }

        if (usuarioIdDto != null) {
            return usuarioRepository.findById(usuarioIdDto)
                    .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + usuarioIdDto));
        }

        throw new IllegalArgumentException("No se pudo determinar el usuario para la reserva.");
    }

    private void validarPropiedadReserva(Reserva reserva, String userEmail, boolean esAdmin) {
        if (esAdmin) return;
        if (userEmail == null || !reserva.getUsuario().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("No tienes permisos para operar sobre esta reserva.");
        }
    }
}

