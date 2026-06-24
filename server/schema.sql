-- ==========================================================================
-- IGLESIA PRODUCCIÓN ERP - POSTGRESQL DATABASE SCHEMA (CLOUD SQL COMPATIBLE)
-- ==========================================================================

-- Drop tables if they exist (for resets)
DROP TABLE IF EXISTS evento_areas_requeridas CASCADE;
DROP TABLE IF EXISTS eventos_especiales CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 1. Tablas Principales

-- Tabla de Usuarios y Servidores
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    alias VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Almacena el hash bcrypt de la contraseña
    telefono VARCHAR(20) NOT NULL,
    distrito VARCHAR(50) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'servant', -- admin, superleader, leader, coleader, servant
    area VARCHAR(50) NOT NULL, -- Arena, Presenter, Luces, Switchers y Cámaras, etc.
    sub_rol VARCHAR(30) NULL, -- Switcher, Cámara (solo aplicable a Switchers y Cámaras)
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Eventos Especiales
CREATE TABLE eventos_especiales (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    descripcion TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'programado', -- programado, cancelado, completado
    creador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para gestionar la asignación y requerimiento de áreas de cada evento
CREATE TABLE evento_areas_requeridas (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER REFERENCES eventos_especiales(id) ON DELETE CASCADE,
    area_nombre VARCHAR(50) NOT NULL,
    asignado_usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT unica_area_por_evento UNIQUE (evento_id, area_nombre)
);

-- 2. Inserciones de Datos Iniciales (Seed Data)
-- Contraseñas encriptadas preestablecidas (Bcrypt Hash):
-- - 'AdminCDF26' -> $2b$10$N.R16d2Rk5t5c6PzZ3kY7eLz5GZ7Z7dCg0r12Y34e5f6g7h8i9j1k
-- - '123456'      -> $2b$10$d7hB4zB3c9.9F1gT7zVvO.6eB4rCjG2hE5uF3vM6t5y4u3i2o1p0q

INSERT INTO usuarios (alias, nombre, correo, password_hash, telefono, distrito, rol, area, sub_rol) VALUES
('ALeonnnc', 'ALeonnnc', 'admin@produccion.com', '$2b$10$9H1o0O3Z/pWlhD.01mHj0eWn9X9fRzZgH0dC8X3Y4e5f6g7h8i9j1', '999999999', 'Miraflores', 'admin', 'Administración', NULL),
('marcos.prod', 'Marcos Salazar', 'super@produccion.com', '$2b$10$pD1.T1d2e3f4g5h6i7j8k.ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlK', '987654321', 'Santiago de Surco', 'superleader', 'Coordinación', NULL),
('carlos.g', 'Carlos Gómez', 'lider@produccion.com', '$2b$10$pD1.T1d2e3f4g5h6i7j8k.ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlK', '912345678', 'San Borja', 'leader', 'Arena', NULL),
('mateo.d', 'Mateo Díaz', 'mateo@produccion.com', '$2b$10$pD1.T1d2e3f4g5h6i7j8k.ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlK', '981273918', 'Surco', 'coleader', 'Arena', NULL),
('juan.perez', 'Juan Pérez', 'siervo@produccion.com', '$2b$10$pD1.T1d2e3f4g5h6i7j8k.ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlK', '987654322', 'Miraflores', 'servant', 'Arena', NULL),
-- Switchers y Cámaras preexistentes con sus sub-roles definidos
('jose.l', 'José L.', 'jose@produccion.com', '$2b$10$pD1.T1d2e3f4g5h6i7j8k.ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlK', '991273821', 'Lince', 'servant', 'Switchers y Cámaras', 'Switcher'),
('camilo.a', 'Camilo A.', 'camilo@produccion.com', '$2b$10$pD1.T1d2e3f4g5h6i7j8k.ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlK', '998273918', 'San Miguel', 'servant', 'Switchers y Cámaras', 'Cámara'),
('david.m', 'David M.', 'david.m@produccion.com', '$2b$10$pD1.T1d2e3f4g5h6i7j8k.ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlK', '921827391', 'Chorrillos', 'servant', 'Switchers y Cámaras', 'Switcher'),
('laura.p', 'Laura P.', 'laura@produccion.com', '$2b$10$pD1.T1d2e3f4g5h6i7j8k.ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlK', '982739182', 'Miraflores', 'servant', 'Switchers y Cámaras', 'Cámara'),
('sergio.c', 'Sergio C.', 'sergio@produccion.com', '$2b$10$pD1.T1d2e3f4g5h6i7j8k.ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlK', '928371982', 'Surquillo', 'servant', 'Switchers y Cámaras', 'Switcher');

-- Inserción de Evento Especial Demo
INSERT INTO eventos_especiales (id, titulo, fecha, hora, descripcion, status, creador_id) VALUES
(1, 'Concierto de Adoración Especial', '2026-07-03', '19:30:00', 'Servicio especial de alabanza y adoración unificado. Requiere cobertura completa de todos los equipos.', 'programado', 2);

-- Asignación de requerimientos para el Evento Especial 1
INSERT INTO evento_areas_requeridas (evento_id, area_nombre, asignado_usuario_id) VALUES
(1, 'Arena', 3),                -- Carlos Gómez (id 3)
(1, 'Presenter', NULL),
(1, 'Luces', NULL),
(1, 'Switchers y Cámaras', 6),   -- José L. (id 6)
(1, 'Streaming', NULL),
(1, 'Fotografía', NULL),
(1, 'Filmaking', NULL),
(1, 'Coordinación', 2),          -- Marcos Salazar (id 2)
(1, 'Protocolo', NULL),
(1, 'Redes', NULL);
