# 🔐 Guía de Configuración Inicial - BodegaPlus

## Paso 1: Obtener la Clave de Servicio de Firebase

1. **Ir a Firebase Console**
   - Abre https://console.firebase.google.com
   - Selecciona tu proyecto BodegaPlus

2. **Descargar Clave de Servicio**
   - Click en el ⚙️ (Configuración) en la esquina superior izquierda
   - Click en "Configuración del proyecto"
   - Ve a la pestaña **"Cuentas de servicio"**
   - Click en botón azul **"Generar clave privada"**
   - Se descargará un archivo JSON

3. **Guardar el archivo**
   - Crea una carpeta `config` en la raíz del proyecto
   - Copia el archivo JSON descargado a: `config/serviceAccountKey.json`
   - **⚠️ NO subas este archivo a Git - está en .gitignore**

## Paso 2: Instalar dependencia (si no está)

```bash
npm install firebase-admin
```

## Paso 3: Crear el Admin Inicial

```bash
node scripts/create-admin.js
```

El script te pedirá:
- **Email** (default: admin@bodegaplus.com)
- **Contraseña** (mínimo 6 caracteres)
- **Nombre completo** (default: Administrador)

### Ejemplo:
```
📧 Email del admin (default: admin@bodegaplus.com): admin@bodegaplus.com
🔑 Contraseña del admin: Password123
👤 Nombre completo (default: Administrador): 
```

El script creará automáticamente:
- ✅ Usuario en Firebase Authentication
- ✅ Perfil en Firestore con rol "admin"

## Paso 4: Acceder al Sistema

1. Abre http://localhost:3000
2. Click en "Iniciar sesión"
3. Ingresa las credenciales del admin creado
4. ¡Ya estás dentro! 🎉

## Pasos Siguientes

Desde el panel de admin puedes:

- **Crear más usuarios** → `/usuarios`
  - Asigna rol: Admin o Empleado
  - Los empleados solo ven Ventas y Clientes
  
- **Gestionar productos** → `/dashboard`
  - Agregar, editar, eliminar productos
  
- **Ver auditoría** → `/auditoria`
  - Historial de todas las operaciones
  
- **Configurar email** → `/configuracion`
  - Para enviar facturas por email

## Solución de Problemas

### Error: "No se encontró 'config/serviceAccountKey.json'"
→ Sigue el **Paso 1** correctamente

### Error: "Email ya registrado"
→ El email ya existe en Firebase. Usa otro email o contacta al admin

### Error: "Contraseña muy débil"
→ Usa una contraseña con al menos 6 caracteres

---

**¿Necesitas ayuda?** Revisa la documentación en [MANUAL_DE_USO.md](../MANUAL_DE_USO.md)
