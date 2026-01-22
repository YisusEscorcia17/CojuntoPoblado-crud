import sqlite3 from "sqlite3";

sqlite3.verbose();

export const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("❌ Error abriendo la BD:", err.message);
  } else {
    console.log("✅ BD conectada: database.sqlite");
  }
});

export function initDb() {
  // Tabla de usuarios
  const sqlUsuarios = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL UNIQUE,
      contrasena TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'vigilante',
      activo INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `;

  // Tabla principal
  const sqlPropietarios = `
    CREATE TABLE IF NOT EXISTS propietarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombrePropietario TEXT NOT NULL,
      correo TEXT NOT NULL,
      cedula TEXT NOT NULL UNIQUE,
      torre TEXT NOT NULL,
      apartamento TEXT NOT NULL,
      cantidadCarros INTEGER NOT NULL DEFAULT 0,
      cantidadMotos INTEGER NOT NULL DEFAULT 0,
      placaCarro TEXT,
      placaMoto TEXT,
      moroso INTEGER NOT NULL DEFAULT 0,
      deudaMoroso REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `;

  // Tabla auditoría/historial
  const sqlHistorial = `
    CREATE TABLE IF NOT EXISTS historial_movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accion TEXT NOT NULL,
      cedula TEXT,
      idPropietario INTEGER,
      datos_antes TEXT,
      datos_despues TEXT,
      fecha TEXT DEFAULT (datetime('now'))
    );
  `;

  // Índices (para búsquedas rápidas)
  const sqlIndex = `
    CREATE INDEX IF NOT EXISTS idx_propietarios_cedula ON propietarios(cedula);
    CREATE INDEX IF NOT EXISTS idx_propietarios_torre_apto ON propietarios(torre, apartamento);
    CREATE INDEX IF NOT EXISTS idx_propietarios_placaCarro ON propietarios(placaCarro);
    CREATE INDEX IF NOT EXISTS idx_propietarios_placaMoto ON propietarios(placaMoto);
    CREATE INDEX IF NOT EXISTS idx_propietarios_moroso ON propietarios(moroso);
  `;

  db.serialize(() => {
    db.run(sqlUsuarios);
    db.run(sqlPropietarios);
    db.run(sqlHistorial);
    db.exec(sqlIndex);
  });
}
