import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { configureSession } from "./src/config/session.js";
import { db, initDb } from "./src/config/database.js";
import { createUser } from "./src/config/auth.js";
import { createBackup } from "./src/utils/backup.js";

// Rutas
import authRoutes from "./src/routes/auth.routes.js";
import propietariosRoutes from "./src/routes/propietarios.routes.js";
import apiRoutes from "./src/routes/api.routes.js";
import importRoutes from "./src/routes/import.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(configureSession());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Inicializar base de datos
initDb();

// Crear usuarios por defecto si no existen
async function createDefaultUsers() {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const count = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as total FROM usuarios", (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
    
    if (count >= 2) {
      console.log(`✅ Usuarios existentes en BD: ${count}`);
      return;
    }
    
    console.log("🔧 Inicializando usuarios por defecto...");
    
    if (count > 0 && count < 2) {
      await new Promise((resolve, reject) => {
        db.run("DELETE FROM usuarios", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    // Generar credenciales seguras por defecto
    const adminPass = process.env.DEFAULT_ADMIN_PASS || `Admin@${new Date().getFullYear()}!Secure${Math.random().toString(36).slice(-4).toUpperCase()}`;
    const vigilantePass = process.env.DEFAULT_VIGILANTE_PASS || `Vigilante@${new Date().getFullYear()}!Secure${Math.random().toString(36).slice(-4).toUpperCase()}`;
    
    await createUser("admin", adminPass, "admin");
    console.log("✅ Usuario admin creado");
    
    await createUser("vigilante", vigilantePass, "vigilante");
    console.log("✅ Usuario vigilante creado");
    
    // Guardar credenciales en archivo temporal (solo desarrollo)
    if (NODE_ENV !== "production") {
      const fs = await import("fs");
      const credencialesPath = path.join(__dirname, "CREDENCIALES_INICIALES.md");
      const contenido = `# Credenciales Iniciales\n\n⚠️ **CAMBIAR INMEDIATAMENTE**\n\n## Admin\n- Usuario: admin\n- Contraseña: ${adminPass}\n\n## Vigilante\n- Usuario: vigilante\n- Contraseña: ${vigilantePass}\n\n---\n*Este archivo se genera automáticamente. Cambiar las contraseñas y eliminar este archivo.*\n`;
      fs.writeFileSync(credencialesPath, contenido);
      console.log("📄 Credenciales guardadas en CREDENCIALES_INICIALES.md");
    }
    
    console.log("✅ Usuarios iniciales listos");
  } catch (err) {
    console.error("⚠️  Error inicializando usuarios:", err.message);
  }
}

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/propietarios", propietariosRoutes);
app.use("/api", apiRoutes);
app.use("/api", importRoutes);

// Ruta de diagnóstico
app.get("/diagnose", async (req, res) => {
  const fs = await import("fs");
  const dbPath = "./database.sqlite";
  const exists = fs.existsSync(dbPath);
  const size = exists ? fs.statSync(dbPath).size : 0;
  
  let userCount = "ERROR";
  let allUsers = [];
  
  db.all("SELECT id, usuario, rol, LENGTH(contrasena) as passwdLen FROM usuarios", (err, rows) => {
    if (err) {
      userCount = "ERROR: " + err.message;
    } else {
      userCount = rows ? rows.length : 0;
      allUsers = rows || [];
    }
    
    res.json({
      dbExists: exists,
      dbSize: size + " bytes",
      dbPath: dbPath,
      userCount: userCount,
      users: allUsers,
      environment: NODE_ENV,
      port: PORT,
      timestamp: new Date().toISOString()
    });
  });
});

// Backup automático cada 12 horas
setInterval(() => {
  createBackup().catch(() => {});
}, 12 * 60 * 60 * 1000);

// Iniciar servidor
app.listen(PORT, async () => {
  try {
    console.log("📊 Base de datos conectada");
    await createDefaultUsers();
    console.log(`🚀 Servidor en línea - ${NODE_ENV} - http://localhost:${PORT}`);
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error.message);
    process.exit(1);
  }
});
