# 🚀 Instrucciones para Producción

## ⚠️ ANTES DE DESPLEGAR EN PRODUCCIÓN

### 1. Variables de Entorno

Crear archivo `.env` en el servidor con:

```bash
# Generar un secret seguro (ejecutar en terminal):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Luego crear .env con:
NODE_ENV=production
PORT=3000
SESSION_SECRET=<pegar-el-secret-generado-arriba>
```

### 2. Seguridad de Base de Datos

```bash
# La base de datos se crea automáticamente
# IMPORTANTE: Hacer backup antes de cualquier actualización
npm run users  # Para gestionar usuarios de forma segura
```

### 3. Credenciales Iniciales

- Al primer inicio, se generan credenciales aleatorias
- En desarrollo se guardan en `CREDENCIALES_INICIALES.md`
- **CAMBIAR INMEDIATAMENTE** usando `npm run users`

### 4. Checklist Pre-Producción

- [ ] `.env` configurado con SESSION_SECRET único
- [ ] NODE_ENV=production en `.env`
- [ ] Credenciales por defecto cambiadas
- [ ] `.gitignore` actualizado (verificar que database.sqlite no se suba)
- [ ] Backups configurados en ubicación segura
- [ ] HTTPS habilitado (necesario para cookies seguras)

### 5. Comandos Útiles

```bash
# Iniciar en producción
NODE_ENV=production npm start

# Gestionar usuarios de forma segura
npm run users

# Verificar estado del servidor
curl http://localhost:3000/diagnose
```

### 6. Archivos Sensibles (NO SUBIR A GIT)

Verificar que estos archivos estén en `.gitignore`:

- `.env`
- `database.sqlite`
- `database.sqlite-wal`
- `database.sqlite-shm`
- `CREDENCIALES_INICIALES.md`
- `backups/`

### 7. Backups

- Automáticos cada 12 horas en carpeta `backups/`
- Manuales desde la interfaz (botón admin)
- Descargar periódicamente a ubicación segura externa

### 8. Monitoreo

Endpoints útiles para monitoreo:

- `/diagnose` - Estado del sistema (solo desarrollo)
- Logs del servidor - revisar errores

### 9. Actualización del Sistema

```bash
# 1. Hacer backup completo
# 2. Detener servidor
# 3. Actualizar código: git pull
# 4. Instalar dependencias: npm install
# 5. Reiniciar: npm start
```

### 10. Contacto de Emergencia

Documentar:
- Hosting/servidor: _____________
- Acceso SSH: _____________
- Backup remoto: _____________

---

**Última actualización:** 2026-01-23
