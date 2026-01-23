import session from "express-session";
import SqliteStore from "connect-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Store = SqliteStore(session);
const NODE_ENV = process.env.NODE_ENV || "development";

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
  return session({
    store: new Store({
      db: "database.sqlite",
      table: "sessions",
      dir: path.join(__dirname, "../..")
    }),
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  });
}
