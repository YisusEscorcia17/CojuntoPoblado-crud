import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../../database.sqlite");
const sqlite = sqlite3.verbose();
export const db = new sqlite.Database(dbPath);

export function initDb() {
  db.serialize(() => {
    // Tabla de propietarios
    db.run(`
      CREATE TABLE IF NOT EXISTS propietarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombrePropietario TEXT NOT NULL,
        correo TEXT NOT NULL,
        cedula TEXT NOT NULL UNIQUE,
        torre TEXT NOT NULL,
        apartamento TEXT NOT NULL,
        cantidadCarros INTEGER DEFAULT 0,
        cantidadMotos INTEGER DEFAULT 0,
        placaCarro TEXT,
        placaMoto TEXT,
        moroso INTEGER DEFAULT 0,
        deudaMoroso REAL DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // Tabla de historial
    db.run(`
      CREATE TABLE IF NOT EXISTS historial_movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accion TEXT NOT NULL,
        cedula TEXT,
        idPropietario INTEGER,
        datos_antes TEXT,
        datos_despues TEXT,
        fecha TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // Tabla de usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        contrasena TEXT NOT NULL,
        rol TEXT DEFAULT 'vigilante',
        createdAt TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);
  });
}
