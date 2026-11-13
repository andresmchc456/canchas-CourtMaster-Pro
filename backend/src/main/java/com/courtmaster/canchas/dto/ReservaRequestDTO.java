package com.courtmaster.canchas.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservaRequestDTO(
    @NotNull(message = "El ID de la cancha es obligatorio")
    Long canchaId,

    @NotNull(message = "La fecha de reserva es obligatoria")
    @FutureOrPresent(message = "La fecha de reserva no puede ser en el pasado")
    LocalDate fecha,

    @NotNull(message = "La hora de inicio es obligatoria")
    LocalTime horaInicio,

    LocalTime horaFin,

    Long usuarioId
) {}

