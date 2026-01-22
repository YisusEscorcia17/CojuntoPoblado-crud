import express from "express";
import path from "path";
import fs from "fs";
import { promises as fsp } from "fs";
import { fileURLToPath } from "url";
import session from "express-session";
import SqliteStore from "connect-sqlite3";
import { db, initDb } from "./db.js";
import { requireAuth, requireAdmin, verifyLogin, createUser, changePassword, changeUsername, getUserById, hashPassword } from "./auth.js";

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Store = SqliteStore(session);

// Configuración de sesiones con SQLite store
app.use(session({
  store: new Store({
    db: "database.sqlite",
    table: "sessions",
    dir: __dirname
  }),
  secret: process.env.SESSION_SECRET || "conjunto-poblado-2026-secret-cambiar-en-produccion",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: NODE_ENV === "production", // HTTPS en producción
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

initDb();

// Crear usuarios por defecto si no existen
async function createDefaultUsers() {
  try {
    // Dar tiempo para que SQLite esté listo
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Contar usuarios en la BD
    const count = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as total FROM usuarios", (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });
    
    // Si hay usuarios, no hacer nada
    if (count >= 2) {
      console.log(`✅ Usuarios existentes en BD: ${count}`);
      return;
    }
    
    console.log("🔧 Inicializando usuarios por defecto...");
    
    // Limpiar tabla si está en estado inconsistente
    if (count > 0 && count < 2) {
      await new Promise((resolve, reject) => {
        db.run("DELETE FROM usuarios", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    // Crear usuario admin
    await createUser("admin", "Admin@2026!Secure", "admin");
    console.log("✅ Usuario admin creado");
    
    // Crear usuario vigilante
    await createUser("vigilante", "Vigilante@2026!Secure", "vigilante");
    console.log("✅ Usuario vigilante creado");
    
    console.log("✅ Usuarios iniciales listos");
  } catch (err) {
    console.error("⚠️  Error inicializando usuarios:", err.message);
  }
}

/* ================= Helpers ================= */
function toInt(v, fallback = 0) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toMoney(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function cleanPlate(v) {
  const s = String(v ?? "").trim().toUpperCase();
  return s === "" ? null : s.replace(/\s+/g, "");
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r;]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function toCsv(rows, columns) {
  const header = columns.join(";");
  const lines = rows.map(r => columns.map(c => csvEscape(r[c])).join(";"));
  return [header, ...lines].join("\n");
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/* ================= Backups ================= */
const BACKUP_DIR = path.join(__dirname, "backups");

async function ensureBackupDir() {
  await fsp.mkdir(BACKUP_DIR, { recursive: true });
}

function vacuumInto(destPath) {
  // VACUUM INTO necesita ruta literal en SQL, escapamos comillas simples
  const safe = destPath.replaceAll("'", "''");
  return new Promise((resolve, reject) => {
    db.run(`VACUUM INTO '${safe}'`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function copyIfExists(src, dest) {
  if (fs.existsSync(src)) {
    await fsp.copyFile(src, dest);
  }
}

async function createBackup() {
  await ensureBackupDir();
  const stamp = nowStamp();
  const dest = path.join(BACKUP_DIR, `database-${stamp}.sqlite`);

  // Intento 1: VACUUM INTO (backup consistente)
  try {
    await vacuumInto(dest);
    return { ok: true, file: dest, method: "VACUUM_INTO" };
  } catch (e) {
    // Fallback: copia archivos (incluye WAL/SHM si existen)
    const srcDb = path.join(__dirname, "database.sqlite");
    const srcWal = path.join(__dirname, "database.sqlite-wal");
    const srcShm = path.join(__dirname, "database.sqlite-shm");

    await fsp.copyFile(srcDb, dest);
    await copyIfExists(srcWal, `${dest}-wal`);
    await copyIfExists(srcShm, `${dest}-shm`);

    return { ok: true, file: dest, method: "COPY_FALLBACK", warn: String(e?.message || e) };
  }
}

// Backup automático: cada 12 horas (ajústalo si quieres)
setInterval(() => {
  createBackup().catch(() => {});
}, 12 * 60 * 60 * 1000);

// Endpoint para backup manual
app.post("/api/backup", async (req, res) => {
  try {
    const result = await createBackup();
    // devolver solo nombre, no ruta completa
    const fileName = path.basename(result.file);
    res.json({ ok: true, file: fileName, method: result.method, warn: result.warn || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: "No se pudo crear backup", detail: String(e?.message || e) });
  }
});

/* ================= AUTENTICACIÓN ================= */

// Login
app.post("/api/auth/login", async (req, res) => {
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

// Cambiar contraseña inicial (sin estar logueado - SOLO PARA ADMIN CON CONTRASEÑA INICIAL)
app.post("/api/auth/setup-password", async (req, res) => {
  const { usuario, contrasenaActual, contrasenaNueva, confirmacion } = req.body;
  
  if (!usuario || !contrasenaActual || !contrasenaNueva || !confirmacion) {
    return res.status(400).json({ ok: false, error: "Todos los campos son requeridos" });
  }
  
  if (contrasenaNueva !== confirmacion) {
    return res.status(400).json({ ok: false, error: "Las contraseñas no coinciden" });
  }
  
  if (contrasenaNueva.length < 6) {
    return res.status(400).json({ ok: false, error: "La contraseña debe tener al menos 6 caracteres" });
  }
  
  try {
    // Verificar que el usuario y contraseña sean correctos
    const user = await verifyLogin(usuario, contrasenaActual);
    if (!user) {
      return res.status(401).json({ ok: false, error: "Usuario o contraseña incorrectos" });
    }
    
    // Verificar que sea admin (por seguridad)
    if (user.rol !== "admin") {
      return res.status(403).json({ ok: false, error: "Solo el admin puede cambiar contraseña inicial" });
    }
    
    // Generar hash de la nueva contraseña usando la función de auth.js
    const newHash = await hashPassword(contrasenaNueva);
    
    // Actualizar contraseña en BD
    await new Promise((resolve, reject) => {
      db.run(
        "UPDATE usuarios SET contrasena = ? WHERE usuario = ?",
        [newHash, usuario],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
    
    return res.json({ ok: true, mensaje: "Contraseña cambiada exitosamente" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Error al cambiar contraseña" });
  }
});

// Obtener usuario actual
app.get("/api/auth/me", (req, res) => {
  if (!req.session?.usuario) {
    return res.status(401).json({ error: "No autenticado" });
  }
  res.json(req.session.usuario);
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// Reinicio de BD (endpoint secreto para emergencias)
app.post("/api/admin/reset-db", async (req, res) => {
  const { token } = req.body;
  
  // Token simple de emergencia
  if (token !== "RESET2026POBLADO") {
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }
  
  try {
    // Limpiar tabla usuarios
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM usuarios", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Crear usuarios por defecto
    await createDefaultUsers();
    
    res.json({ ok: true, mensaje: "BD reiniciada" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Cambiar contraseña
app.post("/api/auth/change-password", requireAuth, async (req, res) => {
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
    
    // Verificar contraseña actual
    const { verifyPassword } = await import("./auth.js");
    const isValid = await verifyPassword(contrasenaActual, (await new Promise((resolve, reject) => {
      db.get("SELECT contrasena FROM usuarios WHERE id = ?", [req.session.usuario.id], (err, row) => {
        if (err) reject(err);
        else resolve(row?.contrasena);
      });
    })));
    
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
app.post("/api/auth/change-username", requireAuth, async (req, res) => {
  const { usuarioNuevo } = req.body;
  
  if (!usuarioNuevo) {
    return res.status(400).json({ error: "El nuevo usuario es requerido" });
  }
  
  if (usuarioNuevo.length < 3) {
    return res.status(400).json({ error: "El usuario debe tener al menos 3 caracteres" });
  }
  
  try {
    // Verificar que el nuevo usuario no exista
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
    
    // Actualizar la sesión
    req.session.usuario.usuario = usuarioNuevo;
    
    res.json({ ok: true, message: "Usuario cambiado exitosamente", nuevoUsuario: usuarioNuevo });
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar usuario" });
  }
});

/* ================= CRUD ================= */

// ============ CREATE ============
app.post("/api/propietarios", requireAdmin, (req, res) => {
  const {
    nombrePropietario,
    correo,
    cedula,
    torre,
    apartamento,
    cantidadCarros,
    cantidadMotos,
    placaCarro,
    placaMoto,
    moroso,
    deudaMoroso
  } = req.body;

  if (!nombrePropietario || !correo || !cedula || !torre || !apartamento) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }
  if (!isEmail(correo)) {
    return res.status(400).json({ error: "Correo inválido." });
  }

  const deuda = Math.max(0, toMoney(deudaMoroso, 0));
  const isMoroso = !!moroso;

  if (isMoroso && deuda <= 0) {
    return res.status(400).json({ error: "Si está moroso, debes ingresar cuánto debe (mayor a 0)." });
  }

  const pc = cleanPlate(placaCarro);
  const pm = cleanPlate(placaMoto);

  const sql = `
    INSERT INTO propietarios
    (nombrePropietario, correo, cedula, torre, apartamento, cantidadCarros, cantidadMotos, placaCarro, placaMoto, moroso, deudaMoroso)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    String(nombrePropietario).trim(),
    String(correo).trim(),
    String(cedula).trim(),
    String(torre).trim(),
    String(apartamento).trim(),
    Math.max(0, toInt(cantidadCarros, 0)),
    Math.max(0, toInt(cantidadMotos, 0)),
    pc,
    pm,
    isMoroso ? 1 : 0,
    deuda
  ];

  db.run(sql, params, function (err) {
    if (err) {
      if (String(err.message).includes("UNIQUE")) {
        return res.status(409).json({ error: "Ya existe un registro con esa cédula." });
      }
      return res.status(500).json({ error: "Error guardando en BD.", detail: err.message });
    }

    const newId = this.lastID;

    const datosDespues = JSON.stringify({
      id: newId,
      nombrePropietario: String(nombrePropietario).trim(),
      correo: String(correo).trim(),
      cedula: String(cedula).trim(),
      torre: String(torre).trim(),
      apartamento: String(apartamento).trim(),
      cantidadCarros: Math.max(0, toInt(cantidadCarros, 0)),
      cantidadMotos: Math.max(0, toInt(cantidadMotos, 0)),
      placaCarro: pc,
      placaMoto: pm,
      moroso: isMoroso ? 1 : 0,
      deudaMoroso: deuda
    });

    db.run(
      `INSERT INTO historial_movimientos (accion, cedula, idPropietario, datos_despues)
       VALUES (?, ?, ?, ?)`,
      ["INSERT", String(cedula).trim(), newId, datosDespues],
      () => res.status(201).json({ id: newId })
    );
  });
});

// ============ READ (lista + búsqueda) ============
app.get("/api/propietarios", (req, res) => {
  const q = String(req.query.q || "").trim();
  const moroso = req.query.moroso;

  let sql = `SELECT * FROM propietarios`;
  const params = [];
  const where = [];

  if (q) {
    where.push(`(
      nombrePropietario LIKE ? OR
      correo LIKE ? OR
      cedula LIKE ? OR
      torre LIKE ? OR
      apartamento LIKE ? OR
      placaCarro LIKE ? OR
      placaMoto LIKE ?
    )`);
    const like = `%${q}%`;
    params.push(like, like, like, like, like, like, like);
  }

  if (moroso === "1" || moroso === "0") {
    where.push(`moroso = ?`);
    params.push(toInt(moroso, 0));
  }

  if (where.length) sql += ` WHERE ` + where.join(" AND ");
  sql += ` ORDER BY id DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Error consultando BD.", detail: err.message });
    res.json(rows);
  });
});

// ============ READ (uno) ============
app.get("/api/propietarios/:id", (req, res) => {
  const id = toInt(req.params.id);
  db.get(`SELECT * FROM propietarios WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: "Error consultando BD.", detail: err.message });
    if (!row) return res.status(404).json({ error: "No encontrado." });
    res.json(row);
  });
});

// ============ UPDATE ============
app.put("/api/propietarios/:id", requireAdmin, (req, res) => {
  const id = toInt(req.params.id);

  const {
    nombrePropietario,
    correo,
    cedula,
    torre,
    apartamento,
    cantidadCarros,
    cantidadMotos,
    placaCarro,
    placaMoto,
    moroso,
    deudaMoroso
  } = req.body;

  if (!nombrePropietario || !correo || !cedula || !torre || !apartamento) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }
  if (!isEmail(correo)) {
    return res.status(400).json({ error: "Correo inválido." });
  }

  const deuda = Math.max(0, toMoney(deudaMoroso, 0));
  const isMoroso = !!moroso;

  if (isMoroso && deuda <= 0) {
    return res.status(400).json({ error: "Si está moroso, debes ingresar cuánto debe (mayor a 0)." });
  }

  const pc = cleanPlate(placaCarro);
  const pm = cleanPlate(placaMoto);

  db.get(`SELECT * FROM propietarios WHERE id = ?`, [id], (err, beforeRow) => {
    if (err) return res.status(500).json({ error: "Error consultando BD.", detail: err.message });
    if (!beforeRow) return res.status(404).json({ error: "No encontrado." });

    const sql = `
      UPDATE propietarios SET
        nombrePropietario = ?,
        correo = ?,
        cedula = ?,
        torre = ?,
        apartamento = ?,
        cantidadCarros = ?,
        cantidadMotos = ?,
        placaCarro = ?,
        placaMoto = ?,
        moroso = ?,
        deudaMoroso = ?
      WHERE id = ?
    `;

    const params = [
      String(nombrePropietario).trim(),
      String(correo).trim(),
      String(cedula).trim(),
      String(torre).trim(),
      String(apartamento).trim(),
      Math.max(0, toInt(cantidadCarros, 0)),
      Math.max(0, toInt(cantidadMotos, 0)),
      pc,
      pm,
      isMoroso ? 1 : 0,
      deuda,
      id
    ];

    db.run(sql, params, function (err2) {
      if (err2) {
        if (String(err2.message).includes("UNIQUE")) {
          return res.status(409).json({ error: "Ya existe un registro con esa cédula." });
        }
        return res.status(500).json({ error: "Error actualizando BD.", detail: err2.message });
      }

      const datosAntes = JSON.stringify(beforeRow);
      const datosDespues = JSON.stringify({
        id,
        nombrePropietario: String(nombrePropietario).trim(),
        correo: String(correo).trim(),
        cedula: String(cedula).trim(),
        torre: String(torre).trim(),
        apartamento: String(apartamento).trim(),
        cantidadCarros: Math.max(0, toInt(cantidadCarros, 0)),
        cantidadMotos: Math.max(0, toInt(cantidadMotos, 0)),
        placaCarro: pc,
        placaMoto: pm,
        moroso: isMoroso ? 1 : 0,
        deudaMoroso: deuda
      });

      db.run(
        `INSERT INTO historial_movimientos (accion, cedula, idPropietario, datos_antes, datos_despues)
         VALUES (?, ?, ?, ?, ?)`,
        ["UPDATE", String(cedula).trim(), id, datosAntes, datosDespues],
        () => res.json({ ok: true })
      );
    });
  });
});

// ============ DELETE ============
app.delete("/api/propietarios/:id", requireAdmin, (req, res) => {
  const id = toInt(req.params.id);

  db.get(`SELECT * FROM propietarios WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: "Error consultando BD.", detail: err.message });
    if (!row) return res.status(404).json({ error: "No encontrado." });

    db.run(`DELETE FROM propietarios WHERE id = ?`, [id], function (err2) {
      if (err2) return res.status(500).json({ error: "Error eliminando en BD.", detail: err2.message });

      db.run(
        `INSERT INTO historial_movimientos (accion, cedula, idPropietario, datos_antes)
         VALUES (?, ?, ?, ?)`,
        ["DELETE", row.cedula, id, JSON.stringify(row)],
        () => res.json({ ok: true })
      );
    });
  });
});

/* ================= EXPORT CSV ================= */

// Export propietarios
app.get("/api/export/propietarios.csv", (req, res) => {
  db.all(`SELECT * FROM propietarios ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).send("Error exportando propietarios");

    const cols = [
      "id",
      "nombrePropietario",
      "correo",
      "cedula",
      "torre",
      "apartamento",
      "cantidadCarros",
      "cantidadMotos",
      "placaCarro",
      "placaMoto",
      "moroso",
      "deudaMoroso",
      "createdAt"
    ];

    const csv = toCsv(rows, cols);
    const fileName = `propietarios-${nowStamp()}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(csv);
  });
});

// Export historial
app.get("/api/export/historial.csv", (req, res) => {
  db.all(`SELECT * FROM historial_movimientos ORDER BY fecha DESC`, [], (err, rows) => {
    if (err) return res.status(500).send("Error exportando historial");

    const cols = [
      "id",
      "accion",
      "cedula",
      "idPropietario",
      "datos_antes",
      "datos_despues",
      "fecha"
    ];

    const csv = toCsv(rows, cols);
    const fileName = `historial-${nowStamp()}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(csv);
  });
});

app.listen(PORT, async () => {
  try {
    console.log("📊 Base de datos conectada");
    await createDefaultUsers();
    console.log("✅ Usuarios iniciales listos");
    console.log(`🚀 Servidor en línea - ${NODE_ENV}`);
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error.message);
    process.exit(1);
  }
});

