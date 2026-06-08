# Sistema de Gestión de Ventas BodegaPlus - Guía de Uso

## 🎯 Descripción General

BodegaPlus es un sistema integral de gestión de ventas e inventario con:
- **Gestión de Clientes** - Registro y búsqueda por cédula
- **Módulo de Ventas** - Venta rápida con búsqueda de cliente
- **Generación de Facturas** - PDF automático en cada venta
- **Sistema de Auditoría** - Registro completo de todas las operaciones
- **Gestión de Roles** - Control de permisos (Admin vs Empleado)

---

## 👥 Estructura de Roles

### 🔐 Administrador
Puede hacer todo, incluyendo:
- ✅ Registrar clientes
- ✅ Hacer ventas
- ✅ Ver auditoría completa
- ✅ Configurar email para envío de facturas
- ✅ Ver dashboards
- ✅ Gestionar inventario
- ✅ Ver reportes

### 👨‍💼 Empleado
Permisos limitados:
- ✅ Registrar clientes
- ✅ Hacer ventas
- ❌ Ver auditoría
- ❌ Configurar email
- ✅ Ver dashboard básico
- ✅ Gestionar inventario propio
- ❌ Ver reportes detallados

---

## 📱 Módulos

### 1. Gestión de Clientes (`/clientes`)
**Acceso:** Admin + Empleado

**Funcionalidades:**
- Registrar nuevos clientes con:
  - Cédula (única)
  - Nombre y Apellido
  - Email y Teléfono
  - Dirección y Ciudad
- Ver lista de todos los clientes registrados
- Búsqueda rápida

**Auditoría:** Se registra cada cliente nuevo

### 2. Módulo de Ventas (`/ventas`)
**Acceso:** Admin + Empleado

**Flujo:**
```
1. Ingrese cédula del cliente
   ↓
2. Sistema busca automáticamente en BD
   ↓
3. Si existe, muestra datos del cliente
   ↓
4. Agregue productos al carrito
   ↓
5. El sistema calcula automáticamente:
   - Subtotal
   - IVA (19%)
   - Total
   ↓
6. Genere la factura
   ↓
7. PDF se descarga automáticamente
```

**Detalles:**
- Búsqueda de cliente por cédula
- Carrito con múltiples productos
- Cálculo automático de totales
- IVA 19% incluido
- Observaciones opcionales
- Descarga automática de PDF
- Generación automática de número de factura (FAC-001, FAC-002, etc.)

**Auditoría:** Se registra cada venta (cliente, vendedor, total)

### 3. Auditoría (`/auditoria`)
**Acceso:** Solo Admin

**Información disponible:**
- Fecha y hora exacta de la operación
- Tipo de operación:
  - Ingreso de Producto
  - Venta
  - Actualización
  - Eliminación
- Usuario que realizó la operación
- Descripción de lo sucedido
- Detalles específicos:
  - Nombre del producto
  - Cantidad
  - Precio unitario
  - Total

**Filtros:**
- Todas las operaciones
- Solo ingresos de productos
- Solo ventas

### 4. Configuración de Email (`/configuracion`)
**Acceso:** Solo Admin

**Para qué sirve:**
Configura el servidor de correo desde donde se enviarán las facturas.

**Requiere:**
- Email remitente (Ej: tuempresa@gmail.com)
- Contraseña o token de aplicación
- Servidor SMTP (Ej: smtp.gmail.com)
- Puerto (típicamente 587 o 465)
- Activar SSL/TLS

**Servidores recomendados:**
- **Gmail:** smtp.gmail.com, Puerto 587, TLS
- **Outlook:** smtp.office365.com, Puerto 587, TLS
- **Yahoo:** smtp.mail.yahoo.com, Puerto 587, TLS

---

## 🔄 Flujo Típico de Trabajo

### Empleado
```
1. Login
2. Registrar nuevo cliente (si es necesario)
3. Hacer venta:
   - Buscar cliente por cédula
   - Agregar productos
   - Generar factura PDF
   - Descargar
   - Enviar por email (cuando esté disponible)
```

### Administrador
```
1. Login
2. Ver dashboard con KPIs
3. Configurar email (si es primera vez)
4. Supervisar actividades:
   - Revisar auditoría
   - Ver ventas por vendedor
   - Verificar ingresos de productos
5. Hacer ventas si es necesario
6. Generar reportes
```

---

## 📊 Dashboard

Muestra en tiempo real:
- Total de Productos en Stock
- Total de Ingresos (Facturas)
- Total de Gastos
- Productos con Stock Bajo (≤5)
- Gráficos de tendencias

---

## 📝 Datos de Factura

Cada factura contiene:
- Número único (FAC-001, FAC-002, etc.)
- Fecha y hora
- Información del cliente (Nombre, Cédula, Email)
- Detalle de productos (Cantidad, Precio Unitario, Subtotal)
- Subtotal
- IVA 19%
- Total
- Nombre del vendedor
- Observaciones (si aplica)

---

## 🔐 Seguridad

- Autenticación con Firebase
- Roles verificados en cada acción
- Rutas protegidas por rol
- Auditoría completa de operaciones
- Cédulas únicas por cliente
- Historial inmutable de ventas

---

## 🚀 Características Futuras

- [ ] Envío automático de facturas por email
- [ ] Descuentos por cliente/volumen
- [ ] Devoluciones y notas de crédito
- [ ] Reportes avanzados por período
- [ ] Exportar auditoría a Excel
- [ ] Integración con pasarelas de pago
- [ ] App móvil

---

## ❓ FAQ

### ¿Cómo doy acceso a un nuevo empleado?
1. El empleado se registra en el sitio
2. Tú (como admin) cambias su rol a "empleado"
3. Listo, ya puede hacer ventas

### ¿Qué pasa si ingreso dos clientes con la misma cédula?
El sistema previene esto: Solo puedes tener un cliente por cédula.

### ¿Puedo modificar una factura ya generada?
No, es por seguridad y auditoría. Todas las facturas son inmutables.

### ¿Se puede ver quién vendió qué?
Sí, en la Auditoría el admin ve el nombre completo de quién realizó cada venta.

### ¿Qué pasa con el PDF si cambian los datos del cliente?
El PDF fue creado con los datos exactos del cliente en ese momento, por lo que no cambia.

---

## 📞 Soporte

Para problemas o preguntas, contacta con tu administrador de sistema.
