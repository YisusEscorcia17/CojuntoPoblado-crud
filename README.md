# 🏢 Sistema de Gestión de Propietarios - Conjunto El Poblado

Sistema CRUD para gestión de propietarios, vehículos y estados de mora en conjuntos residenciales.

## 📁 Estructura del Proyecto

```
CojuntoPoblado-crud/
├── src/
│   ├── config/           # Configuraciones del sistema
│   │   ├── auth.js       # Autenticación y gestión de usuarios
│   │   ├── database.js   # Configuración de base de datos
│   │   └── session.js    # Configuración de sesiones
│   ├── middleware/       # Middlewares de Express
│   │   └── authMiddleware.js
│   ├── routes/           # Rutas de la API
│   │   ├── auth.routes.js
│   │   ├── propietarios.routes.js
│   │   └── api.routes.js
│   └── utils/            # Utilidades y helpers
│       ├── backup.js     # Sistema de backups
│       └── helpers.js    # Funciones auxiliares
├── public/               # Archivos estáticos (frontend)
│   ├── index.html
│   ├── login.html
│   ├── setup.html
│   ├── app.js
│   └── styles.css
├── scripts/              # Scripts de utilidad
│   └── gestionar-usuarios.js
├── backups/              # Backups automáticos
├── server.js             # Servidor principal
├── package.json
└── README.md
```

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (IMPORTANTE)
cp .env.example .env
# Editar .env y cambiar SESSION_SECRET

# Iniciar servidor
npm start

# Modo desarrollo (con nodemon)
npm run dev
```

## 👥 Gestión de Usuarios

```bash
# Menú interactivo para gestionar usuarios
npm run users
```

Opciones disponibles:
- Listar usuarios
- Crear nuevo usuario (admin o vigilante)
- Eliminar usuario

## 🔐 Usuarios Iniciales

Al iniciar por primera vez, el sistema crea automáticamente usuarios por defecto con credenciales seguras.

⚠️ **IMPORTANTE**: 
- Las credenciales se guardan en `CREDENCIALES_INICIALES.md` (no se sube a Git)
- **CAMBIAR INMEDIATAMENTE** después del primer inicio
- Usar `npm run users` para gestionar usuarios de forma segura

## 🎯 Características

### Roles de Usuario

**Administrador**:
- CRUD completo de propietarios
- Exportar datos (CSV)
- Crear backups manuales
- Acceso total al sistema

**Vigilante**:
- Solo lectura de propietarios
- Búsqueda y filtros
- Sin permisos de edición

### Funcionalidades

- ✅ Gestión de propietarios y vehículos
- 🔍 Búsqueda y filtros avanzados
- 📊 Control de estado de mora
- 📥 Exportación a CSV
- 💾 Backups automáticos cada 12 horas
- 🔐 Sistema de autenticación seguro
- 📱 Interfaz responsive
- 🎨 Notificaciones toast visuales

## 📊 Base de Datos

SQLite con 3 tablas principales:
- `propietarios`: Información de residentes
- `usuarios`: Sistema de autenticación
- `historial_movimientos`: Auditoría de cambios

## 🔧 Scripts Disponibles

```bash
npm start      # Iniciar servidor en producción
npm run dev    # Iniciar en modo desarrollo
npm run users  # Gestionar usuarios (CLI)
```

## 🌐 Acceso

- **URL Local**: http://localhost:3000
- **Login**: `/login.html`
- **Dashboard**: `/index.html`
- **Diagnóstico**: `/diagnose`

## 💾 Backups

- **Automáticos**: Cada 12 horas
- **Manuales**: Botón en la interfaz (solo admin)
- **Ubicación**: `backups/`

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Sesiones HTTP-only
- Validación de roles en backend
- CSRF protection en producción

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/change-username` - Cambiar usuario

### Propietarios
- `GET /api/propietarios` - Listar (con filtros)
- `GET /api/propietarios/:id` - Obtener uno
- `POST /api/propietarios` - Crear (admin)
- `PUT /api/propietarios/:id` - Actualizar (admin)
- `DELETE /api/propietarios/:id` - Eliminar (admin)

### Utilidades
- `POST /api/backup` - Crear backup manual
- `GET /api/export/propietarios.csv` - Exportar propietarios
- `GET /api/export/historial.csv` - Exportar historial

## 📄 Licencia

© 2026 Conjunto El Poblado - Uso interno
