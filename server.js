import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { configureSession } from "./src/config/session.js";
import { db, initDb } from "./src/config/database.js";

// Rutas
import authRoutes from "./src/routes/auth.routes.js";
import propietariosRoutes from "./src/routes/propietarios.routes.js";
import apiRoutes from "./src/routes/api.routes.js";
import importRoutes from "./src/routes/import.routes.js";
import usuariosRoutes from "./src/routes/usuarios.routes.js";

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
    
    // Verificar si ya existen los usuarios por defecto
    const existingUsers = await new Promise((resolve, reject) => {
      db.all("SELECT usuario FROM usuarios WHERE usuario IN ('admin', 'vigilante')", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    const hasAdmin = existingUsers.some(u => u.usuario === 'admin');
    const hasVigilante = existingUsers.some(u => u.usuario === 'vigilante');
    
    if (hasAdmin && hasVigilante) {
      console.log(`✅ Usuarios por defecto ya existen en BD`);
      return;
    }
    
    console.log("🔧 Creando usuarios por defecto faltantes...");
    
    // Usar contraseñas de las variables de entorno
    const adminPass = process.env.DEFAULT_ADMIN_PASS;
    const vigilantePass = process.env.DEFAULT_VIGILANTE_PASS;
    
    if (!adminPass || !vigilantePass) {
      console.warn("⚠️  DEFAULT_ADMIN_PASS y DEFAULT_VIGILANTE_PASS no definidos");
      console.warn("⚠️  Configura estas variables de entorno en Render");
      return;
    }
    
    // Importar bcrypt directamente aquí
    const bcrypt = await import("bcryptjs");
    
    // Crear admin si no existe
    if (!hasAdmin) {
      const adminHash = await bcrypt.default.hash(adminPass, 10);
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO usuarios (usuario, contrasena, rol) VALUES (?, ?, ?)",
          ["admin", adminHash, "admin"],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log("✅ Usuario admin creado");
    }
    
    // Crear vigilante si no existe
    if (!hasVigilante) {
      const vigilanteHash = await bcrypt.default.hash(vigilantePass, 10);
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO usuarios (usuario, contrasena, rol) VALUES (?, ?, ?)",
          ["vigilante", vigilanteHash, "vigilante"],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log("✅ Usuario vigilante creado");
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
app.use("/api/usuarios", usuariosRoutes);

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
