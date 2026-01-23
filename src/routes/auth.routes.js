import express from "express";
import { verifyLogin, hashPassword, changePassword, changeUsername, getUserById, verifyPassword } from "../config/auth.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
  const { usuario, contrasena } = req.body;
  
  if (!usuario || !contrasena) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  }
  
  try {
    const user = await verifyLogin(usuario, contrasena);
    if (!user) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }
    
    req.session.usuario = user;
    res.json({ ok: true, usuario: user.usuario, rol: user.rol });
  } catch (err) {
    res.status(500).json({ error: "Error en login" });
  }
});

// Obtener usuario actual
router.get("/me", (req, res) => {
  if (!req.session?.usuario) {
    return res.status(401).json({ error: "No autenticado" });
  }
  res.json(req.session.usuario);
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// Cambiar contraseña
router.post("/change-password", requireAuth, async (req, res) => {
  const { contrasenaActual, contrasenaNueva, confirmacion } = req.body;
  
  if (!contrasenaActual || !contrasenaNueva || !confirmacion) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }
  
  if (contrasenaNueva.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }
  
  if (contrasenaNueva !== confirmacion) {
    return res.status(400).json({ error: "Las contraseñas no coinciden" });
  }
  
  try {
    const user = await getUserById(req.session.usuario.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    
    const currentHash = await new Promise((resolve, reject) => {
      db.get("SELECT contrasena FROM usuarios WHERE id = ?", [req.session.usuario.id], (err, row) => {
        if (err) reject(err);
        else resolve(row?.contrasena);
      });
    });
    
    const isValid = await verifyPassword(contrasenaActual, currentHash);
    
    if (!isValid) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }
    
    await changePassword(req.session.usuario.id, contrasenaNueva);
    res.json({ ok: true, message: "Contraseña cambiada exitosamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
});

// Cambiar usuario
router.post("/change-username", requireAuth, async (req, res) => {
  const { usuarioNuevo } = req.body;
  
  if (!usuarioNuevo) {
    return res.status(400).json({ error: "El nuevo usuario es requerido" });
  }
  
  if (usuarioNuevo.length < 3) {
    return res.status(400).json({ error: "El usuario debe tener al menos 3 caracteres" });
  }
  
  try {
    const existing = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM usuarios WHERE usuario = ? AND id != ?", [usuarioNuevo, req.session.usuario.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existing) {
      return res.status(400).json({ error: "Este usuario ya está en uso" });
    }
    
    await changeUsername(req.session.usuario.id, usuarioNuevo);
    req.session.usuario.usuario = usuarioNuevo;
    
    res.json({ ok: true, message: "Usuario cambiado exitosamente", nuevoUsuario: usuarioNuevo });
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar usuario" });
  }
});

export default router;
