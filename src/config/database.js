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
  
  // Función para convertir nombres de columnas camelCase a lowercase para PostgreSQL
  const convertColumnNames = (sql) => {
    // Convertir nombres de columnas comunes en INSERT y SELECT
    return sql
      .replace(/nombrePropietario/g, 'nombrepropietario')
      .replace(/cantidadCarros/g, 'cantidadcarros')
      .replace(/cantidadMotos/g, 'cantidadmotos')
      .replace(/placaCarro/g, 'placacarro')
      .replace(/placaMoto/g, 'placamoto')
      .replace(/deudaMoroso/g, 'deudamoroso')
      .replace(/idPropietario/g, 'idpropietario')
      .replace(/createdAt/g, 'createdat');
  };
  
  // Función para convertir una fila de PostgreSQL (lowercase) a camelCase
  const convertRowToCamelCase = (row) => {
    const mapping = {
      'nombrepropietario': 'nombrePropietario',
      'cantidadcarros': 'cantidadCarros',
      'cantidadmotos': 'cantidadMotos',
      'placacarro': 'placaCarro',
      'placamoto': 'placaMoto',
      'deudamoroso': 'deudaMoroso',
      'idpropietario': 'idPropietario',
      'createdat': 'createdAt'
    };
    
    const converted = {};
    for (const [key, value] of Object.entries(row)) {
      const camelKey = mapping[key] || key;
      converted[camelKey] = value;
    }
    return converted;
  };
  
  // Wrapper para compatibilidad con SQLite API
  db = {
    run: (sql, params = [], callback = () => {}) => {
      let pgSql = convertPlaceholders(sql);
      pgSql = convertColumnNames(pgSql);
      
      // Si es INSERT y no tiene RETURNING, agregarlo automáticamente
      if (pgSql.trim().toUpperCase().startsWith('INSERT') && 
          !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql = pgSql.trim().replace(/;?\s*$/, '') + ' RETURNING id';
      }
      
      pool.query(pgSql, params)
        .then(result => {
          // Simular el contexto de SQLite con lastID
          const context = {
            lastID: result.rows?.[0]?.id || null,
            changes: result.rowCount || 0
          };
          callback.call(context, null, result);
        })
        .catch(err => callback(err));
    },
    get: (sql, params = [], callback) => {
      let pgSql = convertPlaceholders(sql);
      pgSql = convertColumnNames(pgSql);
      pool.query(pgSql, params)
        .then(result => {
          // Convertir nombres de columnas de vuelta a camelCase
          const row = result.rows[0];
          if (row) {
            const converted = convertRowToCamelCase(row);
            callback(null, converted);
          } else {
            callback(null, row);
          }
        })
        .catch(err => callback(err));
    },
    all: (sql, params = [], callback) => {
      let pgSql = convertPlaceholders(sql);
      pgSql = convertColumnNames(pgSql);
      pool.query(pgSql, params)
        .then(result => {
          // Convertir nombres de columnas de vuelta a camelCase para cada fila
          const rows = result.rows.map(row => convertRowToCamelCase(row));
          callback(null, rows);
        })
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
      // Crear tablas para PostgreSQL (sin comillas para compatibilidad)
      db.run(`
        CREATE TABLE IF NOT EXISTS propietarios (
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
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS historial_movimientos (
          id SERIAL PRIMARY KEY,
          accion TEXT NOT NULL,
          cedula TEXT,
          idpropietario INTEGER,
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
          createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
