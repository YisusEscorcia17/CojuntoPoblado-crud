#!/usr/bin/env node

import { db } from "./db.js";
import { initDb } from "./db.js";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function eliminarUsuario() {
  try {
    initDb();
    
    // Esperar a que se cree la tabla
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log("\n🗑️  ELIMINAR USUARIO\n");
    
    // Listar usuarios primero
    db.all(
      "SELECT id, usuario, rol FROM usuarios WHERE activo = 1 ORDER BY id",
      async (err, rows) => {
        if (err) {
          console.error("❌ Error:", err.message);
          process.exit(1);
        }
        
        if (!rows || rows.length === 0) {
          console.log("❌ No hay usuarios para eliminar\n");
          process.exit(0);
        }
        
        console.log("Usuarios disponibles:");
        console.log("─".repeat(50));
        rows.forEach((user) => {
          const rol = user.rol === "admin" ? "Admin" : "Vigilante";
          console.log(`ID: ${user.id} | ${user.usuario.padEnd(15)} | ${rol}`);
        });
        console.log("─".repeat(50));
        
        const idStr = await question("\n¿ID del usuario a eliminar? (o 0 para cancelar): ");
        const id = parseInt(idStr, 10);
        
        if (id === 0) {
          console.log("❌ Cancelado\n");
          process.exit(0);
        }
        
        const usuario = rows.find(u => u.id === id);
        if (!usuario) {
          console.log("❌ Usuario no encontrado\n");
          process.exit(1);
        }
        
        const confirmacion = await question(`\n⚠️  ¿Seguro que quieres eliminar a '${usuario.usuario}'? (si/no): `);
        
        if (confirmacion.toLowerCase() !== "si") {
          console.log("❌ Cancelado\n");
          process.exit(0);
        }
        
        db.run(
          "DELETE FROM usuarios WHERE id = ?",
          [id],
          (err) => {
            if (err) {
              console.error("❌ Error al eliminar:", err.message);
              process.exit(1);
            }
            
            console.log(`\n✅ Usuario '${usuario.usuario}' eliminado\n`);
            process.exit(0);
          }
        );
      }
    );
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

eliminarUsuario();
