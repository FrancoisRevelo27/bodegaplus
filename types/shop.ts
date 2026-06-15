export interface Product {
  id?: string;
  name: string;
  sku: string;
  barcode?: string;
  unitPrice: number;
  stock: number;
  createdAt?: any;
}

export interface Sale {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalAmount: number;
  vendedorId?: string;
  invoiceId?: string;
  fechaCreacion?: any;
  createdAt?: any;
}

export interface Expense {
  id?: string;
  description: string;
  amount: number;
  createdAt?: any;
}

export interface DashboardSummary {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  totalExpenses: number;
  lowStockCount: number;
}

// ===== CLIENTES =====
export interface Customer {
  id?: string;
  cedula: string; // Número de cédula único
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  createdAt?: any;
  updatedAt?: any;
}

// ===== VENTAS MEJORADAS =====
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id?: string;
  numeroFactura: string;
  customerId: string;
  customerName: string;
  customerCedula: string;
  customerEmail: string;
  items: SaleItem[];
  subtotal: number;
  iva: number;
  total: number;
  vendedorId: string;
  vendedorNombre: string;
  estado: "generada" | "enviada" | "pagada" | "cancelada";
  fechaCreacion: any;
  fechaEnvio?: any;
  observaciones?: string;
  pdfUrl?: string;
}

// ===== AUDITORÍA =====
export interface AuditLog {
  id?: string;
  tipo: "ingreso_producto" | "venta" | "actualizacion_producto" | "eliminacion_producto" | "parametrizacion" | "registro_cliente" | "ingreso_stock";
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  descripcion: string;
  detalles: Record<string, any>;
  fechaCreacion: any;
  ipAddress?: string;
}

// ===== CONFIGURACIÓN =====
export interface EmailConfig {
  id?: string;
  emailRemitente: string;
  contrasena: string;
  servidorSMTP: string;
  puerto: number;
  usarSSL: boolean;
  ivaPercentage?: number;
  createdAt?: any;
  updatedAt?: any;
  updatedBy?: string;
}

// ===== USUARIO CON ROL =====
export type UserRole = "admin" | "empleado";

export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  rol: UserRole;
  estado: "activo" | "inactivo";
  createdAt?: any;
  updatedAt?: any;
}
