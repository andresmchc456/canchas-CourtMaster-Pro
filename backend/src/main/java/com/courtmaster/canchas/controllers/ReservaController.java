package com.courtmaster.canchas.controllers;

import com.courtmaster.canchas.dto.DisponibilidadDTO;
import com.courtmaster.canchas.dto.ModificarReservaRequestDTO;
import com.courtmaster.canchas.dto.ReservaRequestDTO;
import com.courtmaster.canchas.dto.ReservaResponseDTO;
import com.courtmaster.canchas.services.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    /**
     * Paso 1: Endpoint de disponibilidad de bloques horarios.
     * GET /api/canchas/{id}/disponibilidad?fecha=YYYY-MM-DD
     */
    @GetMapping("/api/canchas/{id}/disponibilidad")
    public ResponseEntity<List<DisponibilidadDTO>> obtenerDisponibilidad(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(reservaService.obtenerDisponibilidad(id, fecha));
    }

    /**
     * Paso 2: Endpoint para crear una reserva transaccional con control de concurrencia.
     * POST /api/reservas
     */
    @PostMapping("/api/reservas")
    public ResponseEntity<ReservaResponseDTO> crearReserva(
            @Valid @RequestBody ReservaRequestDTO requestDTO,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        ReservaResponseDTO creada = reservaService.crearReserva(requestDTO, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    /**
     * Paso 3: Endpoint para cancelar una reserva (libera el bloque horario).
     * PUT /api/reservas/{id}/cancelar
     */
    @PutMapping("/api/reservas/{id}/cancelar")
    public ResponseEntity<ReservaResponseDTO> cancelarReserva(
            @PathVariable Long id,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        boolean esAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(reservaService.cancelarReserva(id, email, esAdmin));
    }

    /**
     * Paso 3: Endpoint para modificar una reserva a un nuevo horario.
     * PUT /api/reservas/{id}/modificar
     */
    @PutMapping("/api/reservas/{id}/modificar")
    public ResponseEntity<ReservaResponseDTO> modificarReserva(
            @PathVariable Long id,
            @Valid @RequestBody ModificarReservaRequestDTO requestDTO,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        boolean esAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(reservaService.modificarReserva(id, requestDTO, email, esAdmin));
    }

    /**
     * Consultar el historial de reservas del usuario en sesión.
     * GET /api/reservas/mis-reservas
     */
    @GetMapping("/api/reservas/mis-reservas")
    public ResponseEntity<List<ReservaResponseDTO>> listarMisReservas(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(reservaService.listarMisReservas(email));
    }
}

