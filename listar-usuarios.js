#!/usr/bin/env node

import { db } from "./db.js";
import { initDb } from "./db.js";

async function listarUsuarios() {
  try {
    initDb();
    
    // Esperar a que se cree la tabla
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log("\n📋 USUARIOS EN LA BASE DE DATOS\n");
    console.log("─".repeat(60));
    
    db.all(
      "SELECT id, usuario, rol, createdAt, activo FROM usuarios ORDER BY id",
      (err, rows) => {
        if (err) {
          console.error("❌ Error al consultar usuarios:", err.message);
          process.exit(1);
        }
        
        if (!rows || rows.length === 0) {
          console.log("No hay usuarios creados aún\n");
        } else {
          rows.forEach((user) => {
            const activo = user.activo ? "✅" : "❌";
            const rol = user.rol === "admin" ? "👨‍💼 Admin" : "👁️  Vigilante";
            console.log(`ID: ${user.id} | ${user.usuario.padEnd(15)} | ${rol} | ${activo} Activo | ${user.createdAt}`);
          });
        }
        
        console.log("─".repeat(60));
        console.log("\n💡 Usa 'node crear-usuario.js' para crear nuevos usuarios\n");
        
        process.exit(0);
      }
    );
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

listarUsuarios();
