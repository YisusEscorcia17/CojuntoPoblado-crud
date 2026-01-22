# 🏢 Sistema de Gestión de Propietarios - Conjunto el Poblado

Sistema web completo para la gestión de propietarios, vehículos y estado de mora en conjuntos residenciales.

## ✨ Características

- ✅ **Autenticación con roles**: Admin y Vigilante
- ✅ **CRUD completo**: Crear, leer, actualizar y eliminar propietarios
- ✅ **Búsqueda avanzada**: Por nombre, cédula, placa de vehículos
- ✅ **Filtros**: Por estado de mora (morosos/al día)
- ✅ **Exportación CSV**: De propietarios e historial
- ✅ **Backup automático**: Cada 12 horas
- ✅ **Historial de cambios**: Auditoría completa
- ✅ **Responsive Design**: Funciona en desktop, tablet y móvil
- ✅ **Interfaz moderna**: Diseño dark con gradientes

## 👥 Roles de Usuario

### **Admin**
- Control total del sistema
- Crear, editar, eliminar propietarios
- Descargar reportes (CSV)
- Crear backups
- Ver historial completo

### **Vigilante**
- Solo lectura y búsqueda
- Ver información de propietarios
- Buscar por nombre, cédula, placa
- Filtrar por estado de mora
- Sin acceso a crear/editar/eliminar

## 🚀 Instalación Local

```bash
# Clonar repositorio
git clone <tu-url-del-repo>
cd CojuntoPoblado-crud

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con tus valores
# SESSION_SECRET=tu-secreto-aqui

# Ejecutar setup (crear usuarios por defecto)
node setup.js

# Iniciar servidor
npm start
```

Luego accede a `http://localhost:3000`

## 🔑 Credenciales por Defecto

⚠️ **IMPORTANTE**: Cambiar estas contraseñas en producción

```
Admin:
  Usuario: admin
  Contraseña: admin123

Vigilante:
  Usuario: vigilante
  Contraseña: vigilante123
```

## 📦 Stack Tecnológico

- **Backend**: Node.js + Express
- **Base de datos**: SQLite3
- **Autenticación**: express-session + bcryptjs
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Sesiones**: express-session

## 🗄️ Base de Datos

### Tablas

- **usuarios**: Usuarios del sistema con roles
- **propietarios**: Datos de propietarios
- **historial_movimientos**: Auditoría de cambios

## 🔐 Seguridad

- Contraseñas hasheadas con bcryptjs (10 rounds)
- Sesiones HTTP-only en producción
- HTTPS en producción (Render lo proporciona)
- Validación en backend de todos los permisos
- CSRF protection vía sesiones

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/logout` - Logout

### Propietarios
- `GET /api/propietarios` - Listar
- `POST /api/propietarios` - Crear (Admin)
- `PUT /api/propietarios/:id` - Actualizar (Admin)
- `DELETE /api/propietarios/:id` - Eliminar (Admin)

### Reportes
- `GET /api/export/propietarios.csv` - Exportar propietarios (Admin)
- `GET /api/export/historial.csv` - Exportar historial (Admin)
- `POST /api/backup` - Crear backup (Admin)

## 🌐 Despliegue en Render

1. **Conecta tu repositorio GitHub a Render**
2. **Crea un nuevo Web Service**
3. **Configura variables de entorno**:
   ```
   SESSION_SECRET=tu-secreto-super-seguro
   NODE_ENV=production
   ```
4. **Build command**: `npm install`
5. **Start command**: `npm start`

Tu app estará en: `https://tu-app.onrender.com`

## 📝 Notas

- Los backups se guardan en `/backups/`
- La BD SQLite se guarda en `database.sqlite`
- El historial se mantiene automáticamente
- Las sesiones expiran en 24 horas

## 👨‍💻 Autor

Hecho con ❤️ para Conjunto el Poblado

## 📄 Licencia

Privada - Uso interno
