package com.courtmaster.canchas.repositories;

import com.courtmaster.canchas.entities.EstadoReserva;
import com.courtmaster.canchas.entities.Reserva;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    /**
     * Consulta crítica con bloqueo pesimista exclusivo (SELECT ... FOR UPDATE)
     * para verificar concurrencia y evitar solapamientos simultáneos.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Reserva r WHERE r.cancha.id = :canchaId AND r.fecha = :fecha AND r.horaInicio = :horaInicio AND r.estado = :estado")
    Optional<Reserva> findReservaActivaConBloqueo(
            @Param("canchaId") Long canchaId,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("estado") EstadoReserva estado
    );

    /**
     * Consulta con bloqueo pesimista para modificaciones excluyendo el ID actual de la reserva.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Reserva r WHERE r.cancha.id = :canchaId AND r.fecha = :fecha AND r.horaInicio = :horaInicio AND r.estado = :estado AND r.id != :reservaId")
    Optional<Reserva> findReservaActivaConBloqueoExcluyendoId(
            @Param("canchaId") Long canchaId,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("estado") EstadoReserva estado,
            @Param("reservaId") Long reservaId
    );

    /**
     * Retorna todas las reservas activas de una cancha en una fecha específica para calcular disponibilidad.
     */
    List<Reserva> findByCanchaIdAndFechaAndEstado(Long canchaId, LocalDate fecha, EstadoReserva estado);

    /**
     * Retorna el historial de reservas de un usuario específico.
     */
    List<Reserva> findByUsuarioIdOrderByFechaDescHoraInicioDesc(Long usuarioId);
}

