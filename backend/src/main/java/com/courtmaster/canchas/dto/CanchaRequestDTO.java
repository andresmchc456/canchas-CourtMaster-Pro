package com.courtmaster.canchas.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CanchaRequestDTO(
    @NotBlank(message = "El nombre de la cancha es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder los 100 caracteres")
    String nombre,

    @NotBlank(message = "El tipo de suelo es obligatorio (ej. Césped Sintético, Parquet, Arcilla, Cemento)")
    @Size(max = 50, message = "El tipo de suelo no puede exceder los 50 caracteres")
    String tipoSuelo,

    @NotNull(message = "Debe indicar si la cancha cuenta con iluminación")
    Boolean iluminacion,

    @NotNull(message = "La tarifa base es obligatoria")
    @DecimalMin(value = "0.0", inclusive = false, message = "La tarifa base debe ser mayor a 0")
    BigDecimal tarifaBase,

    Boolean activa
) {}

