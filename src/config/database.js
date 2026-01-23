import sqlite3 from "sqlite3";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_ENV = process.env.NODE_ENV || "development";
const DATABASE_URL = process.env.DATABASE_URL;

// Determinar qué base de datos usar
const usePostgres = NODE_ENV === "production" && DATABASE_URL;

let db;
let dbType;

if (usePostgres) {
  // PostgreSQL para producción
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  dbType = "postgres";
  
  // Función para convertir placeholders SQLite (?) a PostgreSQL ($1, $2, etc)
  const convertPlaceholders = (sql) => {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  };
  
  // Wrapper para compatibilidad con SQLite API
  db = {
    run: (sql, params = [], callback = () => {}) => {
      const pgSql = convertPlaceholders(sql);
      pool.query(pgSql, params)
        .then(result => {
          // Simular el contexto de SQLite con lastID
          const context = {
            lastID: result.rows?.[0]?.id || result.rowCount || null
          };
          callback.call(context, null, result);
        })
        .catch(err => callback(err));
    },
    get: (sql, params = [], callback) => {
      const pgSql = convertPlaceholders(sql);
      pool.query(pgSql, params)
        .then(result => callback(null, result.rows[0]))
        .catch(err => callback(err));
    },
    all: (sql, params = [], callback) => {
      const pgSql = convertPlaceholders(sql);
      pool.query(pgSql, params)
        .then(result => callback(null, result.rows))
        .catch(err => callback(err));
    },
    serialize: (fn) => fn(),
    pool: pool
  };
  
  console.log("✅ Usando PostgreSQL (Producción)");
} else {
  // SQLite para desarrollo
  const dbPath = path.join(__dirname, "../../database.sqlite");
  const sqlite = sqlite3.verbose();
  db = new sqlite.Database(dbPath);
  dbType = "sqlite";
  console.log("✅ Usando SQLite (Desarrollo)");
}

export { db, dbType };

export function initDb() {
  db.serialize(() => {
    if (dbType === "postgres") {
      // Crear tablas para PostgreSQL
      db.run(`
        CREATE TABLE IF NOT EXISTS propietarios (
          id SERIAL PRIMARY KEY,
          "nombrePropietario" TEXT NOT NULL,
          correo TEXT NOT NULL,
          cedula TEXT NOT NULL UNIQUE,
          torre TEXT NOT NULL,
          apartamento TEXT NOT NULL,
          "cantidadCarros" INTEGER DEFAULT 0,
          "cantidadMotos" INTEGER DEFAULT 0,
          "placaCarro" TEXT,
          "placaMoto" TEXT,
          moroso INTEGER DEFAULT 0,
          "deudaMoroso" DECIMAL(10,2) DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS historial_movimientos (
          id SERIAL PRIMARY KEY,
          accion TEXT NOT NULL,
          cedula TEXT,
          "idPropietario" INTEGER,
          datos_antes TEXT,
          datos_despues TEXT,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          usuario TEXT NOT NULL UNIQUE,
          contrasena TEXT NOT NULL,
          rol TEXT DEFAULT 'vigilante',
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      // Crear tablas para SQLite
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

      db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario TEXT NOT NULL UNIQUE,
          contrasena TEXT NOT NULL,
          rol TEXT DEFAULT 'vigilante',
          createdAt TEXT DEFAULT (datetime('now', 'localtime'))
        )
      `);
    }
  });
}
