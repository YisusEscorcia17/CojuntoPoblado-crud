import express from "express";
import { db, dbType } from "../config/database.js";

const router = express.Router();

// Ruta para migrar/recrear tablas en PostgreSQL
router.post("/recreate-tables", async (req, res) => {
  if (dbType !== "postgres") {
    return res.json({ ok: false, error: "Solo funciona en PostgreSQL" });
  }

  try {
    // 1. Eliminar tablas existentes
    await new Promise((resolve, reject) => {
      db.run("DROP TABLE IF EXISTS propietarios CASCADE", [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run("DROP TABLE IF EXISTS historial_movimientos CASCADE", [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run("DROP TABLE IF EXISTS usuarios CASCADE", [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 2. Recrear tablas
    await new Promise((resolve, reject) => {
      db.run(`
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
        )
      `, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE historial_movimientos (
          id SERIAL PRIMARY KEY,
          accion TEXT NOT NULL,
          cedula TEXT,
          idpropietario INTEGER,
          datos_antes TEXT,
          datos_despues TEXT,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE usuarios (
          id SERIAL PRIMARY KEY,
          usuario TEXT NOT NULL UNIQUE,
          contrasena TEXT NOT NULL,
          rol TEXT DEFAULT 'vigilante',
          createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ 
      ok: true, 
      mensaje: "Tablas recreadas correctamente. Ahora necesitas crear los usuarios de nuevo desde el panel de usuarios o con las variables de entorno." 
    });

  } catch (err) {
    console.error("Error migrando:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
