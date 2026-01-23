-- Script para arreglar las tablas en PostgreSQL
-- Ejecuta este script en DBeaver conectado a tu base de datos de Render

-- IMPORTANTE: Este script eliminará todas las tablas y datos existentes
-- Como mencionaste que no has subido nada, esto es seguro

-- 1. Eliminar tablas existentes
DROP TABLE IF EXISTS historial_movimientos CASCADE;
DROP TABLE IF EXISTS propietarios CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS session CASCADE;

-- 2. Crear tabla propietarios con nombres en lowercase (sin comillas)
CREATE TABLE propietarios (
  id SERIAL PRIMARY KEY,
  nombrepropietario TEXT NOT NULL,
  correo TEXT NOT NULL,
  cedula TEXT NOT NULL UNIQUE,
  torre TEXT NOT NULL,
  apartamento TEXT NOT NULL,
  cantidadcarros INTEGER DEFAULT 0,
  cantidadmotos INTEGER DEFAULT 0,
  placacarro TEXT,
  placamoto TEXT,
  moroso INTEGER DEFAULT 0,
  deudamoroso DECIMAL(10,2) DEFAULT 0,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear tabla historial_movimientos
CREATE TABLE historial_movimientos (
  id SERIAL PRIMARY KEY,
  accion TEXT NOT NULL,
  cedula TEXT,
  idpropietario INTEGER,
  datos_antes TEXT,
  datos_despues TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear tabla usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  usuario TEXT NOT NULL UNIQUE,
  contrasena TEXT NOT NULL,
  rol TEXT DEFAULT 'vigilante',
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Crear tabla session para las sesiones
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- 6. Insertar usuario admin con contraseña: holamundo123
-- Hash bcrypt generado: $2a$10$SGIw2K0w4doMEg.5/vXyee.jHMYFSn1klFJBIVGvPwJpy7Uevque6
INSERT INTO usuarios (usuario, contrasena, rol) 
VALUES ('admin', '$2a$10$SGIw2K0w4doMEg.5/vXyee.jHMYFSn1klFJBIVGvPwJpy7Uevque6', 'admin')
ON CONFLICT (usuario) DO NOTHING;

-- 7. Verificar que todo se creó correctamente
SELECT 'Tabla propietarios creada' as mensaje, COUNT(*) as registros FROM propietarios
UNION ALL
SELECT 'Tabla usuarios creada', COUNT(*) FROM usuarios
UNION ALL
SELECT 'Tabla historial_movimientos creada', COUNT(*) FROM historial_movimientos
UNION ALL
SELECT 'Tabla session creada', COUNT(*) FROM session;

-- Mensaje final
SELECT 'TABLAS RECREADAS CORRECTAMENTE! Ahora puedes agregar propietarios desde la aplicación' as resultado;
