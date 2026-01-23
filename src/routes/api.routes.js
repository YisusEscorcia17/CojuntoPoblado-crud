import express from "express";
import path from "path";
import { db } from "../config/database.js";
import { toCsv, nowStamp } from "../utils/helpers.js";
import { createBackup } from "../utils/backup.js";

const router = express.Router();

// Backup manual
router.post("/backup", async (req, res) => {
  try {
    const result = await createBackup();
    const fileName = path.basename(result.file);
    res.json({ ok: true, file: fileName, method: result.method, warn: result.warn || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: "No se pudo crear backup", detail: String(e?.message || e) });
  }
});

// Export propietarios
router.get("/export/propietarios.csv", (req, res) => {
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
router.get("/export/historial.csv", (req, res) => {
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

export default router;
