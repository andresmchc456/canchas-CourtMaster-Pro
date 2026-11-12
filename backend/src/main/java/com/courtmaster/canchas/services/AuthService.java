package com.courtmaster.canchas.services;

import com.courtmaster.canchas.config.JwtService;
import com.courtmaster.canchas.dto.AuthResponse;
import com.courtmaster.canchas.dto.LoginRequest;
import com.courtmaster.canchas.dto.RegisterRequest;
import com.courtmaster.canchas.entities.Rol;
import com.courtmaster.canchas.entities.Usuario;
import com.courtmaster.canchas.repositories.RolRepository;
import com.courtmaster.canchas.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El email ya se encuentra registrado.");
        }

        Rol rolUser = rolRepository.findByNombre("ROLE_USER")
                .orElseGet(() -> rolRepository.save(Rol.builder().nombre("ROLE_USER").build()));

        Usuario nuevoUsuario = Usuario.builder()
                .nombre(request.getNombre().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .telefono(request.getTelefono() != null ? request.getTelefono().trim() : null)
                .rol(rolUser)
                .activa(true)
                .build();

        Usuario guardado = usuarioRepository.save(nuevoUsuario);
        String jwtToken = jwtService.generateToken(guardado);

        return AuthResponse.builder()
                .token(jwtToken)
                .type("Bearer")
                .id(guardado.getId())
                .nombre(guardado.getNombre())
                .email(guardado.getEmail())
                .rol(guardado.getRol().getNombre())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().trim().toLowerCase(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Credenciales inválidas. Verifica tu correo y contraseña.");
        }

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + request.getEmail()));

        if (!usuario.isActiva()) {
            throw new IllegalStateException("Esta cuenta ha sido desactivada. Contacta al administrador.");
        }

        String jwtToken = jwtService.generateToken(usuario);

        return AuthResponse.builder()
                .token(jwtToken)
                .type("Bearer")
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .rol(usuario.getRol().getNombre())
                .build();
    }
}

