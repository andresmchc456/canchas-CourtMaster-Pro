-- ==============================================================================
-- Script de Migración Flyway: V3__crear_reservas.sql
-- Proyecto: CourtMaster Pro - HU04 (Gestión de Reservas y Validación de Disponibilidad)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS reservas (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    cancha_id BIGINT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    precio_historico NUMERIC(10, 2) NOT NULL CHECK (precio_historico >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_reserva_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_cancha FOREIGN KEY (cancha_id) REFERENCES canchas (id) ON DELETE RESTRICT,
    CONSTRAINT chk_estado_reserva CHECK (estado IN ('ACTIVA', 'CANCELADA')),
    CONSTRAINT chk_horas_reserva CHECK (hora_inicio < hora_fin)
);

-- Índices de consulta frecuente para disponibilidad
CREATE INDEX IF NOT EXISTS idx_reservas_cancha_fecha ON reservas(cancha_id, fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);

-- Índice único condicional para garantizar a nivel de motor SQL que no haya doble reserva activa
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reserva_activa 
ON reservas (cancha_id, fecha, hora_inicio) 
WHERE estado = 'ACTIVA';

