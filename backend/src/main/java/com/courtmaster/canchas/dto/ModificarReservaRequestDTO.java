package com.courtmaster.canchas.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record ModificarReservaRequestDTO(
    @NotNull(message = "La nueva fecha es obligatoria")
    @FutureOrPresent(message = "La nueva fecha no puede ser en el pasado")
    LocalDate nuevaFecha,

    @NotNull(message = "La nueva hora de inicio es obligatoria")
    LocalTime nuevaHoraInicio,

    LocalTime nuevaHoraFin
) {}

