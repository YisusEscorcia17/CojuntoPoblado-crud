import { createUser } from "./auth.js";
import { initDb } from "./db.js";

async function setupDefaultUsers() {
  try {
    // Inicializar BD
    initDb();
    
    // Esperar un poco para que se cree la tabla
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log("🔧 Creando usuarios de demostración...");
    
    try {
      await createUser("vigilante", "vigilante123", "vigilante");
      console.log("✅ Usuario vigilante creado: usuario: vigilante, contraseña: vigilante123");
    } catch (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        console.log("ℹ️  Usuario vigilante ya existe");
      } else {
        throw err;
      }
    }
    
    console.log("\n✅ Setup completado");
    console.log("📋 Usuarios de demostración creados:");
    console.log("   Admin: usuario: admin, contraseña: admin123");
    console.log("   Vigilante: usuario: vigilante, contraseña: vigilante123");
    console.log("\n⚠️  Cambia estas contraseñas antes de ir a producción\n");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

setupDefaultUsers();
