# 📤 Importación de Datos desde Google Forms

## 🎯 ¿Cómo funciona?

El sistema ahora permite cargar datos masivos desde un archivo CSV exportado de Google Forms.

## 📋 Formato del CSV

Tu Google Forms debe tener las siguientes preguntas (pueden tener nombres parecidos):

| Campo requerido | Ejemplos de nombres en Google Forms |
|----------------|-------------------------------------|
| **Nombre** | "Nombre completo", "Nombre del propietario", "Nombre" |
| **Correo** | "Correo electrónico", "Email", "Correo" |
| **Cédula** | "Cédula", "Documento", "CC" |
| **Torre** | "Torre" |
| **Apartamento** | "Apartamento", "Apto", "Apt" |
| **Cantidad de carros** | "Cantidad de carros", "Carros" |
| **Cantidad de motos** | "Cantidad de motos", "Motos" |
| **Placa carro** | "Placa del carro", "Placa vehículo" |
| **Placa moto** | "Placa de la moto", "Placa motocicleta" |

## 🔧 Pasos para usar

### 1. Exportar desde Google Forms

1. Abre tu formulario de Google Forms
2. Ve a **Respuestas**
3. Click en el icono de **Google Sheets** (crear hoja de cálculo)
4. En la hoja, ve a **Archivo > Descargar > Valores separados por comas (.csv)**

### 2. Importar en el sistema

1. Inicia sesión como **Admin**
2. En el formulario principal, baja hasta la sección **"📤 Importar desde Google Forms"**
3. Click en **"📁 Seleccionar archivo CSV"**
4. Selecciona tu archivo descargado
5. Click en **"⬆️ Importar datos"**

### 3. Resultado

El sistema:
- ✅ **Inserta** propietarios nuevos (si la cédula no existe)
- ✅ **Actualiza** propietarios existentes (si la cédula ya existe)
- ✅ Muestra un resumen detallado de la importación
- ✅ Registra todo en el historial
- ✅ Recarga automáticamente la lista

## 📝 Ejemplo de CSV

```csv
Nombre completo,Correo electrónico,Cédula,Torre,Apartamento,Cantidad de carros,Cantidad de motos,Placa carro,Placa moto
Juan Pérez,juan.perez@email.com,1082123456,A,101,1,0,ABC123,
María García,maria.garcia@email.com,1082234567,A,102,2,1,XYZ789,MOT45D
```

**Archivo de ejemplo incluido:** `ejemplo-google-forms.csv`

## ⚠️ Notas importantes

1. **Campos obligatorios:** Nombre, Correo, Cédula, Torre, Apartamento
2. **Cédula única:** Si la cédula ya existe, se actualiza el registro
3. **Placas opcionales:** Pueden dejarse vacías si no hay vehículo
4. **Cantidades:** Si están vacías, se asume 0
5. **Límite:** Archivos hasta 5MB

## 🎨 Ventajas

✅ Importa múltiples propietarios de una vez  
✅ Actualiza automáticamente los existentes  
✅ No requiere formato exacto (reconoce variaciones)  
✅ Muestra errores detallados si algo falla  
✅ Mantiene historial de todas las importaciones  

## 🆘 Solución de problemas

**"Error al parsear el CSV"**
- Asegúrate de exportar como CSV (valores separados por comas)
- No uses Excel para editar, puede cambiar el formato

**"Faltan campos obligatorios"**
- Verifica que tu Google Forms tenga todas las preguntas necesarias
- Revisa que los nombres de las columnas sean similares a los ejemplos

**"El archivo debe ser formato CSV"**
- Solo acepta archivos .csv
- No uses .xlsx o .xls

## 📞 Soporte

Para más ayuda, revisa los logs del servidor o contacta al administrador del sistema.
