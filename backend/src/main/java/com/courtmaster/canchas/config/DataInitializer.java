package com.courtmaster.canchas.config;

import com.courtmaster.canchas.entities.Rol;
import com.courtmaster.canchas.entities.Usuario;
import com.courtmaster.canchas.repositories.RolRepository;
import com.courtmaster.canchas.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Inicializando datos por defecto en perfil local (H2)...");

        Rol rolAdmin = rolRepository.findByNombre("ROLE_ADMIN")
                .orElseGet(() -> rolRepository.save(Rol.builder().nombre("ROLE_ADMIN").build()));

        rolRepository.findByNombre("ROLE_USER")
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
    }
}

