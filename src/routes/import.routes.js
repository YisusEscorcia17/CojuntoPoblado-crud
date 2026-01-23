import express from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { db } from "../config/database.js";

const router = express.Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

// Función para normalizar encabezados de Google Forms
function normalizarEncabezado(header) {
  const map = {
    'nombre': 'nombrePropietario',
    'nombre completo': 'nombrePropietario',
    'nombre del propietario': 'nombrePropietario',
    'correo': 'correo',
    'correo electrónico': 'correo',
    'correo electronico': 'correo',
    'email': 'correo',
    'cédula': 'cedula',
    'cedula': 'cedula',
    'cc': 'cedula',
    'documento': 'cedula',
    'torre': 'torre',
    'apartamento': 'apartamento',
    'apto': 'apartamento',
    'apt': 'apartamento',
    'cantidad de carros': 'cantidadCarros',
    'cantidad carros': 'cantidadCarros',
    'carros': 'cantidadCarros',
    'cantidad de motos': 'cantidadMotos',
    'cantidad motos': 'cantidadMotos',
    'motos': 'cantidadMotos',
    'placa carro': 'placaCarro',
    'placa del carro': 'placaCarro',
    'placa vehiculo': 'placaCarro',
    'placa moto': 'placaMoto',
    'placa de la moto': 'placaMoto',
    'placa motocicleta': 'placaMoto'
  };

  const normalized = header.toLowerCase().trim();
  return map[normalized] || normalized;
}

// Función para procesar fila
function procesarFila(row) {
  return {
    nombrePropietario: row.nombrePropietario?.trim() || '',
    correo: row.correo?.trim() || '',
    cedula: row.cedula?.toString().trim() || '',
    torre: row.torre?.toString().trim() || '',
    apartamento: row.apartamento?.toString().trim() || '',
    cantidadCarros: parseInt(row.cantidadCarros) || 0,
    cantidadMotos: parseInt(row.cantidadMotos) || 0,
    placaCarro: row.placaCarro?.toString().trim() || null,
    placaMoto: row.placaMoto?.toString().trim() || null,
    moroso: 0,
    deudaMoroso: 0
  };
}

// Ruta para importar CSV
router.post("/importar-csv", upload.single("csvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No se recibió ningún archivo" });
    }

    // Convertir buffer a string
    const csvContent = req.file.buffer.toString('utf-8');

    // Parsear CSV
    let records;
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
      });
    } catch (parseError) {
      return res.status(400).json({ 
        ok: false, 
        error: "Error al parsear el CSV. Verifica que el archivo esté correctamente formateado.",
        detail: parseError.message 
      });
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ ok: false, error: "El archivo CSV está vacío" });
    }

    // Normalizar encabezados
    const recordsNormalizados = records.map(record => {
      const normalizado = {};
      for (const [key, value] of Object.entries(record)) {
        const newKey = normalizarEncabezado(key);
        normalizado[newKey] = value;
      }
      return normalizado;
    });

    // Procesar y validar registros
    const registrosValidos = [];
    const errores = [];

    for (let i = 0; i < recordsNormalizados.length; i++) {
      const fila = recordsNormalizados[i];
      const registro = procesarFila(fila);

      // Validaciones básicas
      if (!registro.nombrePropietario || !registro.correo || !registro.cedula) {
        errores.push({
          fila: i + 2, // +2 porque empezamos en 1 y hay encabezado
          error: "Faltan campos obligatorios (nombre, correo o cédula)"
        });
        continue;
      }

      if (!registro.torre || !registro.apartamento) {
        errores.push({
          fila: i + 2,
          error: "Faltan torre o apartamento"
        });
        continue;
      }

      registrosValidos.push(registro);
    }

    // Insertar o actualizar registros
    let insertados = 0;
    let actualizados = 0;
    let erroresDB = [];

    for (const registro of registrosValidos) {
      try {
        // Verificar si existe por cédula
        const existe = await new Promise((resolve, reject) => {
          db.get(
            `SELECT id FROM propietarios WHERE cedula = ?`,
            [registro.cedula],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (existe) {
          // Actualizar
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE propietarios SET 
                nombrePropietario = ?,
                correo = ?,
                torre = ?,
                apartamento = ?,
                cantidadCarros = ?,
                cantidadMotos = ?,
                placaCarro = ?,
                placaMoto = ?
              WHERE cedula = ?`,
              [
                registro.nombrePropietario,
                registro.correo,
                registro.torre,
                registro.apartamento,
                registro.cantidadCarros,
                registro.cantidadMotos,
                registro.placaCarro,
                registro.placaMoto,
                registro.cedula
              ],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          actualizados++;
        } else {
          // Insertar
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO propietarios (
                nombrePropietario, correo, cedula, torre, apartamento,
                cantidadCarros, cantidadMotos, placaCarro, placaMoto,
                moroso, deudaMoroso
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                registro.nombrePropietario,
                registro.correo,
                registro.cedula,
                registro.torre,
                registro.apartamento,
                registro.cantidadCarros,
                registro.cantidadMotos,
                registro.placaCarro,
                registro.placaMoto,
                registro.moroso,
                registro.deudaMoroso
              ],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          insertados++;
        }

        // Registrar en historial
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO historial_movimientos (accion, cedula, datos_despues)
             VALUES (?, ?, ?)`,
            [
              existe ? 'ACTUALIZADO_CSV' : 'CREADO_CSV',
              registro.cedula,
              JSON.stringify(registro)
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

      } catch (dbError) {
        erroresDB.push({
          cedula: registro.cedula,
          nombre: registro.nombrePropietario,
          error: dbError.message
        });
      }
    }

    res.json({
      ok: true,
      insertados,
      actualizados,
      total: insertados + actualizados,
      erroresValidacion: errores.length > 0 ? errores : null,
      erroresDB: erroresDB.length > 0 ? erroresDB : null
    });

  } catch (error) {
    console.error("Error importando CSV:", error);
    res.status(500).json({
      ok: false,
      error: "Error al procesar el archivo CSV",
      detail: error.message
    });
  }
});

export default router;
