# 🚀 Guía de Producción - Conjunto El Poblado

## 🔐 SEGURIDAD - LEER PRIMERO

**⚠️ CRÍTICO:** Después de desplegar, DEBE cambiar las credenciales iniciales INMEDIATAMENTE.

Las credenciales iniciales se generan automáticamente al primer inicio y se guardan en `CREDENCIALES_INICIALES.md` (solo en desarrollo). En producción, revisar logs del servidor.

---

## 📋 Cambiar Credenciales en Producción

### ✅ Opción 1: Desde la App Web (RECOMENDADO)

**La forma más fácil:**

1. Accede a tu URL de producción en `/login.html`
2. Inicia sesión con las credenciales iniciales (ver logs del servidor o CREDENCIALES_INICIALES.md)
3. Haz clic en **"⚙️ Credenciales"** (arriba a la derecha)
4. En la pestaña **"🔑 Contraseña"** cambias la contraseña
5. En la pestaña **"👤 Usuario"** cambias el nombre de usuario
6. Guarda en lugar seguro (password manager)

**Ventajas:**
- No necesita terminal
- Interfaz visual
- Rápido
- Seguro

---

### ✅ Opción 2: Gestionar Usuarios por CLI

Si necesitas crear vigilantes o más admins:

```bash
# En la carpeta del proyecto
npm run users
```

Menú interactivo con opciones:
- Listar todos los usuarios
- Crear nuevo usuario (admin o vigilante)
- Eliminar usuario

---

## 📊 Gestión de Usuarios

### Estructura Recomendada

### **1. Admin Principal** (Acceso Total)
- Nombre sugerido: `admin-conjunto`
- Contraseña: **[Usar contraseña fuerte única]**
- Rol: `admin`

### **2. Vigilantes** (Solo Lectura)
- Nombres sugeridos: `vigilante-turnoA`, `vigilante-turnoB`
- Contraseña: **[Usar contraseñas fuertes únicas]**
- Rol: `vigilante`

---

## 🔑 Estándares de Contraseñas

**Requisitos mínimos:**
- ✅ Mínimo 12 caracteres (16+ recomendado)
- ✅ Una mayúscula
- ✅ Una minúscula
- ✅ Un número
- ✅ Un símbolo especial (!@#$%^&*)

**Ejemplo seguro:** `ConjoAdm!2026@Poblado`

---

## 🔐 Dónde Guardar Credenciales

**NUNCA:**
- ❌ Correo electrónico
- ❌ Documentos de texto sin encriptar
- ❌ Notas en el celular

**SÍ:**
- ✅ Password manager (1Password, Bitwarden, LastPass)
- ✅ Archivo encriptado local
- ✅ Bóveda segura de tu empresa

---

## 🚀 URL de Producción

```
https://cojuntoelpobladosm.onrender.com/login.html
```

---

## 📱 Funcionalidades por Rol

### **Administrador (admin)**
- ✅ Ver propietarios
- ✅ Crear propietarios
- ✅ Editar propietarios
- ✅ Eliminar propietarios
- ✅ Exportar a CSV
- ✅ Ver historial
- ✅ Cambiar credenciales
- ✅ Cambiar credenciales de otros usuarios

### **Vigilante**
- ✅ Ver propietarios (lectura)
- ✅ Buscar por placa
- ✅ Exportar a CSV
- ✅ Ver historial
- ✅ Cambiar su propia contraseña
- ❌ Crear/Editar/Eliminar propietarios

---

## 🔍 Verificación Rápida

Para confirmar que todo funciona:

1. **Accede a la app:** https://cojuntoelpobladosm.onrender.com/login.html
2. **Intenta login** con las credenciales proporcionadas por el administrador
3. **Deberías ver el dashboard con propietarios**
4. **Cambia la contraseña INMEDIATAMENTE** desde "⚙️ Credenciales"

---

## ⚠️ Troubleshooting

### "Usuario o contraseña incorrectos"
- Verifica que escribas correctamente usuario y contraseña
- Asegúrate de no tener Caps Lock activado
- Las contraseñas son sensibles a mayúsculas/minúsculas

### "No puedo acceder después de cambiar credenciales"
- Verifica que guardaste bien la nueva contraseña
- Intenta limpiar cookies del navegador (Ctrl+Shift+Delete)
- Recarga la página (Ctrl+F5)

### "Render no redepliegue después de push"
- Espera 5 minutos completos
- Ve a https://dashboard.render.com
- Busca tu servicio "cojuntoelpobladosm"
- Verifica que diga "Deployed" (no "Building")

---

## 📞 Contacto

Para problemas técnicos, revisa los logs de Render en el dashboard.

**Fecha de este documento:** Enero 2026
**Versión:** 1.0
