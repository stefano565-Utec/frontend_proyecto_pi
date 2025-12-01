// Tipos para las entidades del nuevo backend

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  vendorId?: number; // ID del vendor si el usuario es vendedor
}

export interface MenuItem {
  id?: number;
  itemName: string;
  description?: string;
  price: string;
  vendorId: number;
  vendorName?: string;
  isAvailable: boolean;
  stock: number;
  date?: string; // Fecha de disponibilidad del menú (ISO string)
}

export interface OrderItem {
  menuItemId: number;
  quantity: number;
}

export interface OrderDetail {
  id: number;
  itemName: string;
  quantity: number;
  price: string;
  menuItemId: number; // ID del item del menú (requerido para feedback)
}

export interface Order {
  id?: number;
  status: OrderStatus;
  pickup_time?: number | string;
  userId: number;
  userName?: string;
  vendorId: number;
  vendorName?: string;
  pickupCode?: string; // Código para recoger el pedido
  paymentMethod?: string; // YAPE o PLIN
  mercadoPagoPaymentId?: string; // ID del pago en Mercado Pago
  mercadoPagoPreferenceId?: string; // ID de la preferencia de pago
  items?: OrderDetail[];
}

export interface Feedback {
  id?: number;
  rating: number;
  comment?: string;
  itemName?: string;
  vendorName?: string;
  userId?: number;
  orderId?: number;
  menuItemId?: number;
  createdAt?: string;
}

export interface Vendor {
  id?: number;
  name?: string;
  ubication?: string; // Ubicación del vendor (puesto/local)
  openingTime?: string; // Hora de apertura (formato HH:mm, ej: "08:00")
  closingTime?: string; // Hora de cierre (formato HH:mm, ej: "17:00")
}

export type OrderStatus = 
  | "PENDIENTE_PAGO"
  | "PENDIENTE_VERIFICACION"
  | "PAGADO"
  | "LISTO_PARA_RECOJO"
  | "COMPLETADO"
  | "CANCELADO";

// Tipos para autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token: string;
  vendorId?: number; // ID del vendor si el usuario es vendedor
}

