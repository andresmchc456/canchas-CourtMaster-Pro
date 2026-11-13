package com.courtmaster.canchas.dto;

import java.time.LocalTime;

public record DisponibilidadDTO(
    LocalTime horaInicio,
    LocalTime horaFin,
    boolean disponible,
    String estado
) {}

