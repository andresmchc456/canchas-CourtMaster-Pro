package com.courtmaster.canchas.config;

import com.courtmaster.canchas.entities.Cancha;
import com.courtmaster.canchas.entities.EstadoReserva;
import com.courtmaster.canchas.entities.Reserva;
import com.courtmaster.canchas.entities.Rol;
import com.courtmaster.canchas.entities.Usuario;
import com.courtmaster.canchas.repositories.CanchaRepository;
import com.courtmaster.canchas.repositories.ReservaRepository;
import com.courtmaster.canchas.repositories.RolRepository;
import com.courtmaster.canchas.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Configuration
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final CanchaRepository canchaRepository;
    private final ReservaRepository reservaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Inicializando datos por defecto en perfil local (H2)...");

        Rol rolAdmin = rolRepository.findByNombre("ROLE_ADMIN")
                .orElseGet(() -> rolRepository.save(Rol.builder().nombre("ROLE_ADMIN").build()));

        Rol rolUser = rolRepository.findByNombre("ROLE_USER")
                .orElseGet(() -> rolRepository.save(Rol.builder().nombre("ROLE_USER").build()));

        if (!usuarioRepository.existsByEmail("admin@courtmaster.com")) {
            Usuario admin = Usuario.builder()
                    .nombre("Administrador CourtMaster")
                    .email("admin@courtmaster.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .telefono("+573001234567")
                    .rol(rolAdmin)
                    .activa(true)
                    .build();
            usuarioRepository.save(admin);
            log.info("Usuario administrador creado: admin@courtmaster.com / admin123");
        }

        Usuario jugador = null;
        if (!usuarioRepository.existsByEmail("user@courtmaster.com")) {
            Usuario user = Usuario.builder()
                    .nombre("Usuario Jugador")
                    .email("user@courtmaster.com")
                    .passwordHash(passwordEncoder.encode("user123"))
                    .telefono("+573009876543")
                    .rol(rolUser)
                    .activa(true)
                    .build();
            jugador = usuarioRepository.save(user);
            log.info("Usuario cliente creado: user@courtmaster.com / user123");
        } else {
            jugador = usuarioRepository.findByEmail("user@courtmaster.com").orElse(null);
        }

        if (canchaRepository.count() == 0) {
            List<Cancha> canchas = canchaRepository.saveAll(List.of(
                Cancha.builder().nombre("Cancha Sintética 1 (Fútbol 5)").tipoSuelo("Césped Sintético").iluminacion(true).tarifaBase(new BigDecimal("45.00")).activa(true).build(),
                Cancha.builder().nombre("Cancha Sintética 2 (Fútbol 7)").tipoSuelo("Césped Sintético").iluminacion(true).tarifaBase(new BigDecimal("70.00")).activa(true).build(),
                Cancha.builder().nombre("Cancha de Tenis Central").tipoSuelo("Arcilla").iluminacion(true).tarifaBase(new BigDecimal("35.00")).activa(true).build(),
                Cancha.builder().nombre("Cancha Multideportiva").tipoSuelo("Cemento").iluminacion(false).tarifaBase(new BigDecimal("25.00")).activa(true).build(),
                Cancha.builder().nombre("Cancha de Básquet Pro").tipoSuelo("Parquet").iluminacion(true).tarifaBase(new BigDecimal("50.00")).activa(true).build()
            ));
            log.info("Canchas de prueba inicializadas para perfil local.");

            if (reservaRepository.count() == 0 && jugador != null && !canchas.isEmpty()) {
                Cancha primera = canchas.get(0);
                reservaRepository.save(Reserva.builder()
                        .cancha(primera)
                        .usuario(jugador)
                        .fecha(LocalDate.now())
                        .horaInicio(LocalTime.of(10, 0))
                        .horaFin(LocalTime.of(11, 0))
                        .estado(EstadoReserva.ACTIVA)
                        .precioHistorico(primera.getTarifaBase())
                        .build());
                log.info("Reserva de prueba creada para hoy a las 10:00 en Cancha 1.");
            }
        }
    }
}

