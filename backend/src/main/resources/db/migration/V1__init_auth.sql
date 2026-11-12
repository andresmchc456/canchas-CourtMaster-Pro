-- ==============================================================================
-- Script de Migración Flyway: V1__init_auth.sql
-- Proyecto: CourtMaster Pro - HU02 (Registro, Autenticación y Acceso por Roles)
-- ==============================================================================

-- 1. Creación de la tabla roles
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Creación de la tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol_id BIGINT NOT NULL,
    activa BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles (id) ON DELETE RESTRICT
);

-- Índices para optimizar búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);

-- 3. Inserción de roles por defecto
INSERT INTO roles (nombre) VALUES 
    ('ROLE_ADMIN'),
    ('ROLE_USER')
ON CONFLICT (nombre) DO NOTHING;

-- 4. Inserción del superusuario administrador por defecto
-- Credenciales:
-- Email: admin@courtmaster.com
-- Contraseña sin hashear: admin123
-- Hash Bcrypt (10 rounds): $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWq
INSERT INTO usuarios (nombre, email, password_hash, telefono, rol_id, activa)
SELECT 
    'Administrador CourtMaster',
    'admin@courtmaster.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWq',
    '+573001234567',
    r.id,
    TRUE
FROM roles r
WHERE r.nombre = 'ROLE_ADMIN'
ON CONFLICT (email) DO NOTHING;

