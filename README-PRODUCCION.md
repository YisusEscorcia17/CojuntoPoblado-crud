# 🚀 Guía de Producción - Conjunto El Poblado

## 🔐 SEGURIDAD - LEER PRIMERO

**⚠️ CRÍTICO:** Después de desplegar en Render, DEBE cambiar las credenciales iniciales INMEDIATAMENTE.

Las credenciales iniciales serán proporcionadas por el administrador del sistema. **NO están publicadas aquí por razones de seguridad.**

---

## 📋 Cambiar Credenciales en Producción

### ✅ Opción 1: Desde la App Web (RECOMENDADO)

**La forma más fácil:**

1. Accede a: https://cojuntoelpobladosm.onrender.com/login.html
2. Inicia sesión con las credenciales proporcionadas por el administrador
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

### ✅ Opción 2: Crear Nuevo Usuario en Local (Para múltiples usuarios)

Si necesitas crear vigilantes o más admins, hazlo en tu PC:

```bash
# En la carpeta del proyecto
npm run agregar-usuario
```

Responde las preguntas:
```
👤 Nombre de usuario: ej-vigilante-juan
🔐 Contraseña (mínimo 6 caracteres): [ingresa contraseña fuerte]
🔐 Confirmar contraseña: [confirma contraseña]
👥 Rol (admin/vigilante): vigilante
```

Luego sube a Render:
```bash
git add -A
git commit -m "Agregado usuario vigilante-juan"
git push
```

Espera 2-3 minutos para que Render redepliegue. Listo ✅

---

## 📊 Gestión de Usuarios

### Ver todos los usuarios existentes
```bash
npm run listar-usuarios
```

Salida (ejemplo):
```
ID: 1 | Usuario: admin-conjunto | Rol: Admin
ID: 2 | Usuario: vigilante-juan | Rol: Vigilante
ID: 3 | Usuario: vigilante-maria | Rol: Vigilante
```

### Crear nuevo usuario
```bash
npm run agregar-usuario
```

---

## 🔒 Estructura de Usuarios Recomendada para Producción

Crea una estructura como esta (USAR CONTRASEÑAS FUERTES):

### **1. Admin Principal** (Acceso Total)
- Nombre sugerido: `admin-conjunto`
- Contraseña: **[Usar contraseña fuerte personal]**
- Rol: `admin`

### **2. Vigilante - Turno A** (Solo Lectura)
- Nombre sugerido: `vigilante-turno-a`
- Contraseña: **[Usar contraseña fuerte personal]**
- Rol: `vigilante`

### **3. Vigilante - Turno B** (Solo Lectura)
- Nombre sugerido: `vigilante-turno-b`
- Contraseña: **[Usar contraseña fuerte personal]**
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
