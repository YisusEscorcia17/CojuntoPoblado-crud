# 🏢 Sistema de Gestión - Conjunto El Poblado

Sistema CRUD para gestión de propietarios, vehículos y estados de mora.

## 🚀 Inicio Rápido

```bash
npm install
npm start
```

Acceder: http://localhost:3000/login.html

## 👥 Usuarios

Al primer inicio se crean usuarios automáticamente. Ver logs del servidor para credenciales.

**⚠️ CAMBIAR INMEDIATAMENTE:**
- Desde la web: Click en "⚙️ Credenciales"
- Por terminal: `npm run users`

## 📝 Comandos

```bash
npm start          # Iniciar servidor
npm run dev        # Modo desarrollo
npm run users      # Gestionar usuarios
```

## 🔒 Producción

1. Crear `.env` con:
```bash
NODE_ENV=production
SESSION_SECRET=<generar-con-crypto>
```

2. Cambiar credenciales por defecto
3. Configurar HTTPS

## 📊 Características

- **Admin:** CRUD completo, backups, exportar
- **Vigilante:** Solo lectura y búsqueda
- **Backups:** Automáticos cada 12 horas
- **Exports:** CSV de propietarios e historial
- **Responsive:** Móvil y desktop

## 🔐 Seguridad

- Contraseñas hasheadas (bcrypt)
- Sesiones seguras
- Variables de entorno
- HTTPS en producción

---

© 2026 Conjunto El Poblado
