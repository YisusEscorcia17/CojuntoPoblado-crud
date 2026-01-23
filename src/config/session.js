import session from "express-session";
import SqliteStore from "connect-sqlite3";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_ENV = process.env.NODE_ENV || "development";
const DATABASE_URL = process.env.DATABASE_URL;
const usePostgres = NODE_ENV === "production" && DATABASE_URL;

// Generar secret seguro si no está definido (solo desarrollo)
const getSessionSecret = () => {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  
  if (NODE_ENV === "production") {
    console.error("⚠️  ERROR: SESSION_SECRET no definido en producción");
    process.exit(1);
  }
  
  console.warn("⚠️  Usando SESSION_SECRET temporal (solo desarrollo)");
  return "dev-secret-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export function configureSession() {
  let storeConfig;
  
  if (usePostgres) {
    // PostgreSQL session store para producción
    const PgSession = connectPgSimple(session);
    const pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    storeConfig = new PgSession({
      pool: pool,
      tableName: 'sessions',
      createTableIfMissing: true
    });
    
    console.log("✅ Usando PostgreSQL para sesiones");
  } else {
    // SQLite session store para desarrollo
    const Store = SqliteStore(session);
    storeConfig = new Store({
      db: "database.sqlite",
      table: "sessions",
      dir: path.join(__dirname, "../..")
    });
    
    console.log("✅ Usando SQLite para sesiones");
  }
  
  return session({
    store: storeConfig,
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Render maneja SSL en el proxy
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    },
    proxy: NODE_ENV === "production" // Confiar en el proxy de Render
  });
}
