import bcrypt from "bcryptjs";
import { db } from "./database.js";

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
        "INSERT INTO usuarios (usuario, contrasena, rol) VALUES (?, ?, ?) RETURNING id",
        [usuario, hashed, rol],
        function (err, result) {
          if (err) {
            reject(err);
          } else {
            const id = this.lastID || result?.rows?.[0]?.id || 1;
            resolve({ id, usuario, rol });
          }
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
      "SELECT * FROM usuarios WHERE usuario = ?",
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

// Cambiar contraseña del usuario actual
export function changePassword(userId, newPassword) {
  return new Promise(async (resolve, reject) => {
    try {
      const hashed = await hashPassword(newPassword);
      db.run(
        "UPDATE usuarios SET contrasena = ? WHERE id = ?",
        [hashed, userId],
        function (err) {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

// Cambiar usuario (nombre de usuario)
export function changeUsername(userId, newUsername) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE usuarios SET usuario = ? WHERE id = ?",
      [newUsername, userId],
      function (err) {
        if (err) reject(err);
        else resolve({ success: true, nuevoUsuario: newUsername });
      }
    );
  });
}

// Obtener usuario por ID
export function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, usuario, rol FROM usuarios WHERE id = ?",
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}
