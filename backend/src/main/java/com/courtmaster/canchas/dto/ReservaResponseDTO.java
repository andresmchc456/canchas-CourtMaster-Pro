package com.courtmaster.canchas.dto;

import com.courtmaster.canchas.entities.EstadoReserva;
import com.courtmaster.canchas.entities.Reserva;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record ReservaResponseDTO(
    Long id,
    Long usuarioId,
    String usuarioNombre,
    String usuarioEmail,
    Long canchaId,
    String canchaNombre,
    LocalDate fecha,
    LocalTime horaInicio,
    LocalTime horaFin,
    EstadoReserva estado,
    BigDecimal precioHistorico,
    LocalDateTime createdAt
) {
    public static ReservaResponseDTO fromEntity(Reserva reserva) {
        return new ReservaResponseDTO(
            reserva.getId(),
            reserva.getUsuario().getId(),
            reserva.getUsuario().getNombre(),
            reserva.getUsuario().getEmail(),
            reserva.getCancha().getId(),
            reserva.getCancha().getNombre(),
            reserva.getFecha(),
            reserva.getHoraInicio(),
            reserva.getHoraFin(),
            reserva.getEstado(),
            reserva.getPrecioHistorico(),
            reserva.getCreatedAt()
        );
    }
}

