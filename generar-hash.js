#!/usr/bin/env node

import bcrypt from "bcryptjs";
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

async function generarHash() {
  try {
    console.log("\n🔐 GENERADOR DE HASH PARA CONTRASEÑAS\n");
    console.log("Usa este script para generar hashes que puedas insertar directamente en DB Browser SQLite\n");
    
    const contrasena = await question("Ingresa la contraseña a hashear: ");
    
    if (!contrasena || contrasena.length < 6) {
      console.log("❌ La contraseña debe tener al menos 6 caracteres\n");
      rl.close();
      process.exit(1);
    }
    
    const hash = await bcrypt.hash(contrasena, 10);
    
    console.log("\n" + "═".repeat(70));
    console.log("📋 HASH GENERADO:\n");
    console.log(hash);
    console.log("\n" + "═".repeat(70));
    
    console.log("\n📌 INSTRUCCIONES PARA DB BROWSER SQLITE:\n");
    console.log("1. Abre DB Browser SQLite");
    console.log("2. Abre el archivo: database.sqlite");
    console.log("3. Ve a la pestaña 'Browse Data'");
    console.log("4. Selecciona tabla: 'usuarios'");
    console.log("5. Haz clic en 'New Record' (+)");
    console.log("6. Llena los campos:\n");
    console.log("   - usuario: [Tu usuario]");
    console.log("   - contrasena: [Copia el hash anterior]");
    console.log("   - rol: admin (o vigilante)");
    console.log("   - activo: 1");
    console.log("   - createdAt: CURRENT_TIMESTAMP");
    console.log("\n7. Haz clic en 'Write Changes'");
    console.log("\n✅ ¡Usuario creado!\n");
    
    const otra = await question("¿Generar otro hash? (si/no): ");
    
    if (otra.toLowerCase() === "si") {
      rl.close();
      await generarHash();
    } else {
      console.log("\n👋 ¡Hasta luego!\n");
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

generarHash();
