package com.courtmaster.canchas.controllers;

import com.courtmaster.canchas.dto.AdminReprogramarReservaDTO;
import com.courtmaster.canchas.dto.AdminReservaResponseDTO;
import com.courtmaster.canchas.entities.EstadoReserva;
import com.courtmaster.canchas.services.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reservas")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReservaController {

    private final ReservaService reservaService;

    /**
     * Lista todas las reservas del sistema con filtros opcionales por fecha, cancha y estado.
     * GET /api/admin/reservas?fecha=YYYY-MM-DD&canchaId=1&estado=ACTIVA
     */
    @GetMapping
    public ResponseEntity<List<AdminReservaResponseDTO>> listarReservas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long canchaId,
            @RequestParam(required = false) EstadoReserva estado) {
        return ResponseEntity.ok(reservaService.listarReservasAdmin(fecha, canchaId, estado));
    }

    /**
     * Reprograma la fecha/hora (y opcionalmente cancha) de una reserva ACTIVA con bloqueo pesimista.
     * Soporta PATCH /api/admin/reservas/{id}/horario y PUT /api/admin/reservas/{id}
     */
    @RequestMapping(value = {"/{id}/horario", "/{id}"}, method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<AdminReservaResponseDTO> reprogramarReserva(
            @PathVariable Long id,
            @Valid @RequestBody AdminReprogramarReservaDTO requestDTO) {
        return ResponseEntity.ok(reservaService.reprogramarReservaAdmin(id, requestDTO));
    }

    /**
     * Cancela una reserva (borrado lógico) liberando la franja horaria inmediatamente.
     * PATCH /api/admin/reservas/{id}/cancelar
     */
    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<AdminReservaResponseDTO> cancelarReserva(@PathVariable Long id) {
        return ResponseEntity.ok(reservaService.cancelarReservaAdmin(id));
    }
}
