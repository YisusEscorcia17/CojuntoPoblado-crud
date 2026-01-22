#!/usr/bin/env node

import { createUser } from "./auth.js";
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

async function crearUsuario() {
  try {
    initDb();
    
    // Esperar a que se cree la tabla
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log("\n🆕 CREAR NUEVO USUARIO\n");
    
    const usuario = await question("👤 Nombre de usuario (mínimo 3 caracteres): ");
    
    if (!usuario || usuario.length < 3) {
      console.log("❌ El usuario debe tener al menos 3 caracteres");
      rl.close();
      process.exit(1);
    }
    
    const contrasena = await question("🔐 Contraseña (mínimo 6 caracteres): ");
    
    if (!contrasena || contrasena.length < 6) {
      console.log("❌ La contraseña debe tener al menos 6 caracteres");
      rl.close();
      process.exit(1);
    }
    
    const confirmacion = await question("🔐 Confirmar contraseña: ");
    
    if (contrasena !== confirmacion) {
      console.log("❌ Las contraseñas no coinciden");
      rl.close();
      process.exit(1);
    }
    
    console.log("\n📋 Selecciona el rol:");
    console.log("1. Admin (acceso total)");
    console.log("2. Vigilante (solo lectura)");
    
    const rolOpcion = await question("\nOpción (1 o 2): ");
    
    let rol = "vigilante";
    if (rolOpcion === "1") {
      rol = "admin";
    } else if (rolOpcion !== "2") {
      console.log("❌ Opción inválida");
      rl.close();
      process.exit(1);
    }
    
    try {
      const nuevoUsuario = await createUser(usuario, contrasena, rol);
      console.log("\n✅ Usuario creado exitosamente!");
      console.log(`   Usuario: ${nuevoUsuario.usuario}`);
      console.log(`   Rol: ${nuevoUsuario.rol === "admin" ? "Administrador" : "Vigilante"}`);
      console.log("\n💾 Guarda estas credenciales en un lugar seguro\n");
    } catch (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        console.log("❌ Este usuario ya existe");
      } else {
        console.log(`❌ Error: ${err.message}`);
      }
    }
    
    rl.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

crearUsuario();
