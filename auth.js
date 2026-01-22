import bcrypt from "bcryptjs";
import { db } from "./db.js";

// Función para hashear contraseña
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Función para verificar contraseña
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Crear usuario por primera vez
export function createUser(usuario, contrasena, rol = "vigilante") {
  return new Promise(async (resolve, reject) => {
    try {
      const hashed = await hashPassword(contrasena);
      db.run(
        "INSERT INTO usuarios (usuario, contrasena, rol) VALUES (?, ?, ?)",
        [usuario, hashed, rol],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, usuario, rol });
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener usuario por nombre
export function getUserByUsername(usuario) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM usuarios WHERE usuario = ? AND activo = 1",
      [usuario],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

// Verificar login
export async function verifyLogin(usuario, contrasena) {
  const user = await getUserByUsername(usuario);
  if (!user) return null;
  
  const isValid = await verifyPassword(contrasena, user.contrasena);
  if (!isValid) return null;
  
  return { id: user.id, usuario: user.usuario, rol: user.rol };
}

// Middleware para verificar autenticación
export function requireAuth(req, res, next) {
  if (!req.session?.usuario) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
}

// Middleware para verificar que sea admin
export function requireAdmin(req, res, next) {
  if (!req.session?.usuario) {
    return res.status(401).json({ error: "No autenticado" });
  }
  if (req.session.usuario.rol !== "admin") {
    return res.status(403).json({ error: "No autorizado" });
  }
  next();
}
