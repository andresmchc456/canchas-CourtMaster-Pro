package com.courtmaster.canchas.dto;

import com.courtmaster.canchas.entities.EstadoReserva;
import com.courtmaster.canchas.entities.Reserva;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record AdminReservaResponseDTO(
    Long id,
    Long usuarioId,
    String usuarioNombre,
    String usuarioEmail,
    Long canchaId,
    String canchaNombre,
    String canchaTipoSuelo,
    LocalDate fecha,
    LocalTime horaInicio,
    LocalTime horaFin,
    EstadoReserva estado,
    BigDecimal precioHistorico,
    LocalDateTime createdAt
) {
    public static AdminReservaResponseDTO fromEntity(Reserva reserva) {
        return new AdminReservaResponseDTO(
            reserva.getId(),
            reserva.getUsuario().getId(),
            reserva.getUsuario().getNombre(),
            reserva.getUsuario().getEmail(),
            reserva.getCancha().getId(),
            reserva.getCancha().getNombre(),
            reserva.getCancha().getTipoSuelo(),
            reserva.getFecha(),
            reserva.getHoraInicio(),
            reserva.getHoraFin(),
            reserva.getEstado(),
            reserva.getPrecioHistorico(),
            reserva.getCreatedAt()
        );
    }
}
