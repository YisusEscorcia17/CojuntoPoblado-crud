import fs from "fs";
import path from "path";
import { promises as fsp } from "fs";
import { fileURLToPath } from "url";
import { db } from "../config/database.js";
import { nowStamp } from "./helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, "../../backups");

export async function ensureBackupDir() {
  await fsp.mkdir(BACKUP_DIR, { recursive: true });
}

function vacuumInto(destPath) {
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

export async function createBackup() {
  await ensureBackupDir();
  const stamp = nowStamp();
  const dest = path.join(BACKUP_DIR, `database-${stamp}.sqlite`);

  try {
    await vacuumInto(dest);
    return { ok: true, file: dest, method: "VACUUM_INTO" };
  } catch (e) {
    const srcDb = path.join(__dirname, "../../database.sqlite");
    const srcWal = path.join(__dirname, "../../database.sqlite-wal");
    const srcShm = path.join(__dirname, "../../database.sqlite-shm");

    await fsp.copyFile(srcDb, dest);
    await copyIfExists(srcWal, `${dest}-wal`);
    await copyIfExists(srcShm, `${dest}-shm`);

    return { ok: true, file: dest, method: "COPY_FALLBACK", warn: String(e?.message || e) };
  }
}
