import express from "express";
import { db } from "../config/database.js";
import { hashPassword } from "../config/auth.js";

const router = express.Router();

// Listar todos los usuarios
router.get("/", (req, res) => {
  console.log("🔍 GET /api/usuarios - Sesión:", {
    usuario: req.session?.usuario,
    rol: req.session?.usuario?.rol || req.session?.rol,
    sessionID: req.sessionID
  });

  if (!req.session || !req.session.usuario) {
    console.log("❌ Sin sesión activa");
    return res.status(401).json({ ok: false, error: "No autenticado" });
  }

  const userRole = req.session.usuario?.rol || req.session.rol;
  
  if (userRole !== "admin") {
    console.log("❌ Acceso denegado - Rol:", userRole);
    return res.status(403).json({ ok: false, error: "Acceso denegado. Solo administradores." });
  }

  console.log("✅ Acceso permitido - Obteniendo usuarios...");
  db.all(`SELECT id, usuario, rol, createdAt FROM usuarios ORDER BY id`, [], (err, rows) => {
    if (err) {
      console.error("❌ Error al obtener usuarios:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener usuarios" });
    }
    console.log("✅ Usuarios obtenidos:", rows.length);
    res.json(rows);
  });
});

// Crear usuario
router.post("/", async (req, res) => {
  const userRole = req.session.usuario?.rol || req.session.rol;
  if (userRole !== "admin") {
    return res.status(403).json({ ok: false, error: "Acceso denegado" });
  }

  const { usuario, contrasena, rol } = req.body;

  if (!usuario || !contrasena || !rol) {
    return res.status(400).json({ ok: false, error: "Faltan campos obligatorios" });
  }

  if (rol !== "admin" && rol !== "vigilante") {
    return res.status(400).json({ ok: false, error: "Rol inválido" });
  }

  try {
    // Hashear contraseña
    const hashedPassword = await hashPassword(contrasena);

    db.run(
      `INSERT INTO usuarios (usuario, contrasena, rol) VALUES (?, ?, ?)`,
      [usuario, hashedPassword, rol],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.status(400).json({ ok: false, error: "El usuario ya existe" });
          }
          return res.status(500).json({ ok: false, error: "Error al crear usuario" });
        }

        res.json({
          ok: true,
          id: this.lastID,
          mensaje: "Usuario creado exitosamente"
        });
      }
    );
  } catch (error) {
    res.status(500).json({ ok: false, error: "Error al procesar la contraseña" });
  }
});

// Cambiar contraseña
router.put("/:id/password", async (req, res) => {
  const userRole = req.session.usuario?.rol || req.session.rol;
  if (userRole !== "admin") {
    return res.status(403).json({ ok: false, error: "Acceso denegado" });
  }

  const { id } = req.params;
  const { nuevaContrasena } = req.body;

  if (!nuevaContrasena) {
    return res.status(400).json({ ok: false, error: "La nueva contraseña es requerida" });
  }

  try {
    const hashedPassword = await hashPassword(nuevaContrasena);

    db.run(
      `UPDATE usuarios SET contrasena = ? WHERE id = ?`,
      [hashedPassword, id],
      function (err) {
        if (err) {
          return res.status(500).json({ ok: false, error: "Error al cambiar contraseña" });
        }

        if (this.changes === 0) {
          return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
        }

        res.json({ ok: true, mensaje: "Contraseña actualizada exitosamente" });
      }
    );
  } catch (error) {
    res.status(500).json({ ok: false, error: "Error al procesar la contraseña" });
  }
});

// Eliminar usuario
router.delete("/:id", (req, res) => {
  const userRole = req.session.usuario?.rol || req.session.rol;
  if (userRole !== "admin") {
    return res.status(403).json({ ok: false, error: "Acceso denegado" });
  }

  const { id } = req.params;

  // Verificar que no se elimine a sí mismo
  db.get(`SELECT id FROM usuarios WHERE usuario = ?`, [req.session.usuario], (err, currentUser) => {
    if (err) {
      return res.status(500).json({ ok: false, error: "Error al verificar usuario" });
    }

    if (currentUser && currentUser.id == id) {
      return res.status(400).json({ ok: false, error: "No puedes eliminar tu propio usuario" });
    }

    // Eliminar usuario
    db.run(`DELETE FROM usuarios WHERE id = ?`, [id], function (err) {
      if (err) {
        return res.status(500).json({ ok: false, error: "Error al eliminar usuario" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
      }

      res.json({ ok: true, mensaje: "Usuario eliminado exitosamente" });
    });
  });
});

export default router;
