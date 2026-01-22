#!/usr/bin/env node

import { execSync } from "child_process";
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

async function menu() {
  try {
    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║     🔐 GESTOR DE USUARIOS - CONJUNTO EL POBLADO    ║");
    console.log("╚════════════════════════════════════════════════════╝\n");
    
    console.log("¿Qué deseas hacer?\n");
    console.log("1. 👁️  Listar todos los usuarios");
    console.log("2. ➕ Crear nuevo usuario (Admin o Vigilante)");
    console.log("3. 🗑️  Eliminar un usuario");
    console.log("4. 🚀 Setup: Crear usuarios de demostración");
    console.log("5. 🚪 Salir\n");
    
    const opcion = await question("Selecciona una opción (1-5): ");
    
    switch (opcion.trim()) {
      case "1":
        console.log("\n");
        try {
          execSync("node listar-usuarios.js", { stdio: "inherit" });
        } catch (e) {
          // El script ya maneja el exit
        }
        break;
        
      case "2":
        console.log("\n");
        try {
          execSync("node crear-usuario.js", { stdio: "inherit" });
        } catch (e) {
          // El script ya maneja el exit
        }
        break;
        
      case "3":
        console.log("\n");
        try {
          execSync("node eliminar-usuario.js", { stdio: "inherit" });
        } catch (e) {
          // El script ya maneja el exit
        }
        break;
        
      case "4":
        console.log("\n");
        try {
          execSync("node setup.js", { stdio: "inherit" });
        } catch (e) {
          // El script ya maneja el exit
        }
        break;
        
      case "5":
        console.log("\n👋 ¡Hasta luego!\n");
        process.exit(0);
        break;
        
      default:
        console.log("\n❌ Opción inválida. Intenta de nuevo.\n");
        rl.close();
        await menu();
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

menu();
