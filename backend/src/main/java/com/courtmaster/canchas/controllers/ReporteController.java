package com.courtmaster.canchas.controllers;

import com.courtmaster.canchas.dto.ReporteIngresosDTO;
import com.courtmaster.canchas.services.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReporteController {

    private final ReporteService reporteService;

    /**
     * Endpoint protegido para consultar el resumen de ingresos y ocupación en formato JSON.
     * GET /api/reportes/ingresos?fechaInicio=...&fechaFin=...
     */
    @GetMapping("/ingresos")
    public ResponseEntity<List<ReporteIngresosDTO>> obtenerReporteIngresos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        return ResponseEntity.ok(reporteService.obtenerReporteIngresos(fechaInicio, fechaFin));
    }

    /**
     * Endpoint protegido para exportar y descargar el reporte en formato CSV.
     * GET /api/reportes/ingresos/csv?fechaInicio=...&fechaFin=...
     */
    @GetMapping("/ingresos/csv")
    public ResponseEntity<byte[]> exportarReporteIngresosCSV(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        byte[] archivoCsv = reporteService.generarCsvIngresos(fechaInicio, fechaFin);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reporte_ingresos.csv\"")
                .body(archivoCsv);
    }
}
