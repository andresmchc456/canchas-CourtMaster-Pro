package com.courtmaster.canchas.services;

import com.courtmaster.canchas.dto.ReporteIngresosDTO;
import com.courtmaster.canchas.entities.EstadoReserva;
import com.courtmaster.canchas.repositories.ReservaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReporteService {

    private final ReservaRepository reservaRepository;

    /**
     * Obtiene el resumen de ingresos y reservas por cancha en el rango de fechas especificado.
     */
    @Transactional(readOnly = true)
    public List<ReporteIngresosDTO> obtenerReporteIngresos(LocalDate fechaInicio, LocalDate fechaFin) {
        validarRangoFechas(fechaInicio, fechaFin);
        log.info("Generando reporte de ingresos entre {} y {}", fechaInicio, fechaFin);

        return reservaRepository.obtenerReporteIngresosPorCancha(
                fechaInicio,
                fechaFin,
                EstadoReserva.ACTIVA
        );
    }

    /**
     * Construye y retorna el contenido del reporte en formato CSV.
     */
    @Transactional(readOnly = true)
    public byte[] generarCsvIngresos(LocalDate fechaInicio, LocalDate fechaFin) {
        List<ReporteIngresosDTO> reporte = obtenerReporteIngresos(fechaInicio, fechaFin);

        StringBuilder sb = new StringBuilder();

        // Byte Order Mark (BOM) UTF-8 para garantizar apertura impecable de tildes en MS Excel
        sb.append('\uFEFF');

        // Cabeceras solicitadas
        sb.append("Cancha,Total Reservas,Ingresos Totales\n");

        long acumuladoReservas = 0;
        BigDecimal acumuladoIngresos = BigDecimal.ZERO;

        for (ReporteIngresosDTO item : reporte) {
            String nombreEscapado = escaparCampoCsv(item.nombreCancha());
            sb.append(nombreEscapado).append(",")
              .append(item.totalReservas()).append(",")
              .append(item.ingresosTotales().setScale(2, java.math.RoundingMode.HALF_UP))
              .append("\n");

            acumuladoReservas += item.totalReservas();
            acumuladoIngresos = acumuladoIngresos.add(item.ingresosTotales());
        }

        // Fila resumen de totales
        sb.append("TOTAL GENERAL,")
          .append(acumuladoReservas).append(",")
          .append(acumuladoIngresos.setScale(2, java.math.RoundingMode.HALF_UP))
          .append("\n");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void validarRangoFechas(LocalDate fechaInicio, LocalDate fechaFin) {
        if (fechaInicio == null || fechaFin == null) {
            throw new IllegalArgumentException("Las fechas de inicio y fin son obligatorias.");
        }
        if (fechaInicio.isAfter(fechaFin)) {
            throw new IllegalArgumentException("La fecha de inicio no puede ser posterior a la fecha de fin.");
        }
    }

    private String escaparCampoCsv(String valor) {
        if (valor == null) return "";
        if (valor.contains(",") || valor.contains("\"") || valor.contains("\n")) {
            return "\"" + valor.replace("\"", "\"\"") + "\"";
        }
        return valor;
    }
}
