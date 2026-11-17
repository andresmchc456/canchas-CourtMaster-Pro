package com.courtmaster.canchas.dto;

import java.math.BigDecimal;

public record ReporteIngresosDTO(
    Long canchaId,
    String nombreCancha,
    Long totalReservas,
    BigDecimal ingresosTotales
) {
    public ReporteIngresosDTO {
        if (totalReservas == null) {
            totalReservas = 0L;
        }
        if (ingresosTotales == null) {
            ingresosTotales = BigDecimal.ZERO;
        }
    }
}
