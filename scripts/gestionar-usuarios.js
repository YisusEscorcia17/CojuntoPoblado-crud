#!/usr/bin/env node

import readline from "readline";
import bcrypt from "bcryptjs";
import { db, initDb } from "../src/config/database.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function listarUsuarios() {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, usuario, rol, createdAt FROM usuarios ORDER BY id", (err, rows) => {
      if (err) {
        console.error("❌ Error:", err.message);
        reject(err);
      } else {
        if (rows.length === 0) {
          console.log("\n📭 No hay usuarios en la base de datos.\n");
        } else {
          console.log("\n📋 USUARIOS REGISTRADOS:\n");
          console.log("ID | Usuario      | Rol        | Fecha de Creación");
          console.log("---|--------------|------------|-----------------");
          rows.forEach(row => {
            const fecha = row.createdAt ? row.createdAt.substring(0, 10) : "N/A";
            console.log(`${row.id.toString().padEnd(2)} | ${row.usuario.padEnd(12)} | ${row.rol.padEnd(10)} | ${fecha}`);
          });
          console.log();
        }
        resolve(rows);
      }
    });
  });
}

async function crearUsuario() {
  console.log("\n➕ CREAR NUEVO USUARIO\n");
  
  const usuario = await question("Nombre de usuario (mín. 3 caracteres): ");
  if (usuario.length < 3) {
    console.log("❌ El usuario debe tener al menos 3 caracteres.\n");
    return;
  }
  
  const contrasena = await question("Contraseña (mín. 6 caracteres): ");
  if (contrasena.length < 6) {
    console.log("❌ La contraseña debe tener al menos 6 caracteres.\n");
    return;
  }
  
  const rol = await question("Rol (admin/vigilante): ");
  if (rol !== "admin" && rol !== "vigilante") {
    console.log("❌ El rol debe ser 'admin' o 'vigilante'.\n");
    return;
  }
  
  try {
    const hashed = await bcrypt.hash(contrasena, 10);
    
    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO usuarios (usuario, contrasena, rol) VALUES (?, ?, ?)",
        [usuario, hashed, rol],
        function(err) {
          if (err) {
            if (err.message.includes("UNIQUE")) {
              console.log(`\n❌ El usuario '${usuario}' ya existe.\n`);
            } else {
              console.log(`\n❌ Error: ${err.message}\n`);
            }
            reject(err);
          } else {
            console.log(`\n✅ Usuario '${usuario}' creado exitosamente con rol '${rol}'.\n`);
            resolve();
          }
        }
      );
    });
  } catch (err) {
    // Error ya manejado
  }
}

async function eliminarUsuario() {
  console.log("\n🗑️  ELIMINAR USUARIO\n");
  
  await listarUsuarios();
  
  const id = await question("ID del usuario a eliminar (0 para cancelar): ");
  const userId = parseInt(id);
  
  if (isNaN(userId) || userId === 0) {
    console.log("❌ Operación cancelada.\n");
    return;
  }
  
  try {
    const usuario = await new Promise((resolve, reject) => {
      db.get("SELECT usuario, rol FROM usuarios WHERE id = ?", [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!usuario) {
      console.log(`\n❌ No existe usuario con ID ${userId}.\n`);
      return;
    }
    
    const confirmacion = await question(`¿Seguro que deseas eliminar al usuario '${usuario.usuario}' (${usuario.rol})? (si/no): `);
    
    if (confirmacion.toLowerCase() !== "si") {
      console.log("❌ Operación cancelada.\n");
      return;
    }
    
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM usuarios WHERE id = ?", [userId], function(err) {
        if (err) {
          console.log(`\n❌ Error: ${err.message}\n`);
          reject(err);
        } else {
          console.log(`\n✅ Usuario '${usuario.usuario}' eliminado exitosamente.\n`);
          resolve();
        }
      });
    });
  } catch (err) {
    // Error ya manejado
  }
}

async function menu() {
  try {
    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║     🔐 GESTOR DE USUARIOS - CONJUNTO EL POBLADO    ║");
    console.log("╚════════════════════════════════════════════════════╝\n");
    
    console.log("¿Qué deseas hacer?\n");
    console.log("1. 👁️  Listar todos los usuarios");
    console.log("2. ➕ Crear nuevo usuario (Admin o Vigilante)");
    console.log("3. 🗑️  Eliminar un usuario");
    console.log("4. 🚪 Salir\n");
    
    const opcion = await question("Selecciona una opción (1-4): ");
    
    switch (opcion.trim()) {
      case "1":
        await listarUsuarios();
        break;
        
      case "2":
        await crearUsuario();
        break;
        
      case "3":
        await eliminarUsuario();
        break;
        
      case "4":
        console.log("\n👋 ¡Hasta pronto!\n");
        rl.close();
        process.exit(0);
        return;
        
      default:
        console.log("\n❌ Opción inválida. Por favor selecciona 1-4.\n");
    }
    
    // Volver al menú
    await menu();
  } catch (err) {
    console.error("❌ Error:", err.message);
    rl.close();
    process.exit(1);
  }
}

// Inicializar BD y ejecutar menú
initDb();
setTimeout(() => {
  menu().catch((err) => {
    console.error("❌ Error fatal:", err.message);
    process.exit(1);
  });
}, 500);
