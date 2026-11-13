package com.courtmaster.canchas.dto;

import com.courtmaster.canchas.entities.Cancha;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CanchaResponseDTO(
    Long id,
    String nombre,
    String tipoSuelo,
    Boolean iluminacion,
    BigDecimal tarifaBase,
    Boolean activa,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static CanchaResponseDTO fromEntity(Cancha cancha) {
        return new CanchaResponseDTO(
            cancha.getId(),
            cancha.getNombre(),
            cancha.getTipoSuelo(),
            cancha.getIluminacion(),
            cancha.getTarifaBase(),
            cancha.getActiva(),
            cancha.getCreatedAt(),
            cancha.getUpdatedAt()
        );
    }
}

