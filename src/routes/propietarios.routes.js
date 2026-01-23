import express from "express";
import { db } from "../config/database.js";
import { requireAdmin } from "../middleware/authMiddleware.js";
import { toInt, toMoney, cleanPlate, isEmail } from "../utils/helpers.js";

const router = express.Router();

// CREATE
router.post("/", requireAdmin, (req, res) => {
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

// READ (lista + búsqueda)
router.get("/", (req, res) => {
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

// READ (uno)
router.get("/:id", (req, res) => {
  const id = toInt(req.params.id);
  db.get(`SELECT * FROM propietarios WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: "Error consultando BD.", detail: err.message });
    if (!row) return res.status(404).json({ error: "No encontrado." });
    res.json(row);
  });
});

// UPDATE
router.put("/:id", requireAdmin, (req, res) => {
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

// DELETE
router.delete("/:id", requireAdmin, (req, res) => {
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

export default router;
