-- Script de migración de SQLite a PostgreSQL
-- Ejecutar este SQL en PostgreSQL después de exportar los datos de SQLite

-- Crear tablas (ya se crean automáticamente con initDb)
-- Este script es para referencia si necesitas migrar datos manualmente

-- Exportar datos de SQLite:
-- 1. Abre database.sqlite con DB Browser
-- 2. File > Export > Table(s) as CSV
-- 3. Exporta cada tabla: propietarios, usuarios, historial_movimientos

-- Importar a PostgreSQL:
-- Opción 1: Usar pgAdmin
--   1. Click derecho en tabla > Import/Export
--   2. Selecciona el CSV
--   3. Marca "Header" si tiene encabezados

-- Opción 2: Usar psql
-- \copy propietarios(nombrePropietario,correo,cedula,torre,apartamento,cantidadCarros,cantidadMotos,placaCarro,placaMoto,moroso,deudaMoroso) FROM 'propietarios.csv' CSV HEADER;
-- \copy usuarios(usuario,contrasena,rol) FROM 'usuarios.csv' CSV HEADER;
-- \copy historial_movimientos(accion,cedula,idPropietario,datos_antes,datos_despues) FROM 'historial.csv' CSV HEADER;

-- Verificar datos importados
SELECT COUNT(*) FROM propietarios;
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM historial_movimientos;

-- Resetear secuencias (importante después de importar)
SELECT setval('propietarios_id_seq', (SELECT MAX(id) FROM propietarios));
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('historial_movimientos_id_seq', (SELECT MAX(id) FROM historial_movimientos));
