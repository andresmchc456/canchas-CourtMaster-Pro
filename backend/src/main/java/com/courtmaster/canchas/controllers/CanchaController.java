package com.courtmaster.canchas.controllers;

import com.courtmaster.canchas.dto.CanchaRequestDTO;
import com.courtmaster.canchas.dto.CanchaResponseDTO;
import com.courtmaster.canchas.services.CanchaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/canchas")
@RequiredArgsConstructor
public class CanchaController {

    private final CanchaService canchaService;

    /**
     * Endpoint público: Retorna únicamente las canchas activas para el catálogo de usuarios.
     */
    @GetMapping("/activas")
    public ResponseEntity<List<CanchaResponseDTO>> listarCanchasActivas() {
        return ResponseEntity.ok(canchaService.listarActivas());
    }

    /**
     * Endpoint protegido (ADMIN): Retorna todas las canchas (activas e inactivas) para administración.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CanchaResponseDTO>> listarTodasLasCanchas() {
        return ResponseEntity.ok(canchaService.listarTodas());
    }

    /**
     * Endpoint protegido (ADMIN): Obtiene el detalle de una cancha por ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CanchaResponseDTO> obtenerCanchaPorId(@PathVariable Long id) {
        return ResponseEntity.ok(canchaService.obtenerPorId(id));
    }

    /**
     * Endpoint protegido (ADMIN): Crea una nueva cancha deportiva.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CanchaResponseDTO> crearCancha(@Valid @RequestBody CanchaRequestDTO requestDTO) {
        CanchaResponseDTO creada = canchaService.crearCancha(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    /**
     * Endpoint protegido (ADMIN): Actualiza la información de una cancha existente.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CanchaResponseDTO> actualizarCancha(
            @PathVariable Long id,
            @Valid @RequestBody CanchaRequestDTO requestDTO) {
        return ResponseEntity.ok(canchaService.actualizarCancha(id, requestDTO));
    }

    /**
     * Endpoint protegido (ADMIN): Borrado lógico de una cancha (activa = false).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> desactivarCancha(@PathVariable Long id) {
        canchaService.desactivarCancha(id);
        return ResponseEntity.noContent().build();
    }
}

