package com.courtmaster.canchas.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AdminReprogramarReservaDTO(
    @NotNull(message = "La nueva fecha es obligatoria")
    LocalDate fecha,

    @NotNull(message = "La nueva hora de inicio es obligatoria")
    LocalTime horaInicio,

    Long canchaId
) {}
