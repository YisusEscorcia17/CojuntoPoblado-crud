import readline from "readline";
import bcrypt from "bcryptjs";
import { db, initDb } from "./db.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function agregarUsuario() {
  try {
    console.log("\n🔒 === AGREGAR NUEVO USUARIO ===\n");

    await initDb();

    const usuario = await question("👤 Nombre de usuario: ");

    if (!usuario || usuario.trim() === "") {
      console.error("❌ El nombre de usuario no puede estar vacío");
      rl.close();
      return;
    }

    // Verificar si el usuario ya existe
    const existe = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM usuarios WHERE usuario = ?", [usuario], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existe) {
      console.error("❌ El usuario ya existe");
      rl.close();
      return;
    }

    const contraseña = await question("🔐 Contraseña (mínimo 6 caracteres): ");

    if (contraseña.length < 6) {
      console.error("❌ La contraseña debe tener al menos 6 caracteres");
      rl.close();
      return;
    }

    const confirmacion = await question("🔐 Confirmar contraseña: ");

    if (contraseña !== confirmacion) {
      console.error("❌ Las contraseñas no coinciden");
      rl.close();
      return;
    }

    const rol = await question("👥 Rol (admin/vigilante): ");

    if (!["admin", "vigilante"].includes(rol.toLowerCase())) {
      console.error("❌ Rol inválido. Usa 'admin' o 'vigilante'");
      rl.close();
      return;
    }

    // Generar hash de la contraseña
    const hash = await bcrypt.hash(contraseña, 10);

    // Insertar usuario
    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO usuarios (usuario, contrasena, rol, activo) VALUES (?, ?, ?, ?)",
        [usuario, hash, rol.toLowerCase(), 1],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`\n✅ Usuario creado exitosamente`);
    console.log(`   👤 Usuario: ${usuario}`);
    console.log(`   👥 Rol: ${rol.toLowerCase()}\n`);

    rl.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    rl.close();
    process.exit(1);
  }
}

agregarUsuario();
