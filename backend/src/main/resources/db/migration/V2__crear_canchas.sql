-- ==============================================================================
-- Script de Migración Flyway: V2__crear_canchas.sql
-- Proyecto: CourtMaster Pro - HU03 (Administración de Canchas y Horarios)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS canchas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_suelo VARCHAR(50) NOT NULL,
    iluminacion BOOLEAN NOT NULL DEFAULT FALSE,
    tarifa_base NUMERIC(10, 2) NOT NULL CHECK (tarifa_base >= 0),
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices para optimizar consultas de canchas activas y filtros
CREATE INDEX IF NOT EXISTS idx_canchas_activa ON canchas(activa);
CREATE INDEX IF NOT EXISTS idx_canchas_tipo_suelo ON canchas(tipo_suelo);

-- Datos iniciales de prueba para poblar el catálogo
INSERT INTO canchas (nombre, tipo_suelo, iluminacion, tarifa_base, activa) VALUES
    ('Cancha Sintética 1 (Fútbol 5)', 'Césped Sintético', TRUE, 45.00, TRUE),
    ('Cancha Sintética 2 (Fútbol 7)', 'Césped Sintético', TRUE, 70.00, TRUE),
    ('Cancha de Tenis Central', 'Arcilla', TRUE, 35.00, TRUE),
    ('Cancha Multideportiva', 'Cemento', FALSE, 25.00, TRUE),
    ('Cancha de Básquet Pro', 'Parquet', TRUE, 50.00, TRUE);

