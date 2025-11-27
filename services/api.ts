import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, MenuItem, Order, Feedback, Vendor, LoginRequest, RegisterRequest, AuthResponse, OrderItem } from '../types';

export const API_URL = 'https://calcanean-fundamentally-emmie.ngrok-free.dev';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['ngrok-skip-browser-warning'] = 'true';
  
  if (config.data instanceof FormData && !config.headers['Content-Type']) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    
    const contentType = error.response?.headers?.['content-type'] || error.response?.headers?.['Content-Type'] || '';
    if (contentType.includes('text/html')) {
      const ngrokError = new Error('Error de conexión: El servidor no está disponible. Verifica que el backend esté corriendo y que ngrok esté configurado correctamente.');
      (ngrokError as any).isNgrokError = true;
      (ngrokError as any).originalError = error;
      return Promise.reject(ngrokError);
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials: LoginRequest) => api.post<AuthResponse>('/auth/login', credentials),
  register: (userData: RegisterRequest) => api.post<AuthResponse>('/auth/register', userData),
};

export const userService = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: number) => api.get<User>(`/users/${id}`),
  getCurrentUser: () => api.get<User>('/users/me'),
  updateRole: (id: number, role: string, vendorId?: number | null) => {
    const body: { role: string; vendorId: number | null } = { 
      role,
      vendorId: (vendorId !== undefined && vendorId !== null && vendorId !== 0) ? vendorId : null
    };
    return api.put<User>(`/users/${id}/role`, body);
  },
};

export const menuItemService = {
  getAll: () => api.get<MenuItem[]>('/menu-items'),
  getById: (id: number) => api.get<MenuItem>(`/menu-items/${id}`),
  getToday: () => api.get<MenuItem[]>('/menu-items/today'),
  getByVendorToday: (vendorId: number) => api.get<MenuItem[]>(`/menu-items/vendor/${vendorId}/today`),
  getByDate: (date: string) => api.get<MenuItem[]>(`/menu-items/date/${date}`),
  getByVendorAndDate: (vendorId: number, date: string) => 
    api.get<MenuItem[]>(`/menu-items/vendor/${vendorId}/date/${date}`),
  getByWeek: (weekStartDate: string) => api.get<MenuItem[]>(`/menu-items/week/${weekStartDate}`),
  getByVendorAndWeek: (vendorId: number, weekStartDate: string) => 
    api.get<MenuItem[]>(`/menu-items/vendor/${vendorId}/week/${weekStartDate}`),
  getAllByVendor: (vendorId: number) => api.get<MenuItem[]>(`/menu-items/vendor/${vendorId}/all`),
  create: (menuItem: { itemName: string; description?: string; price: string; vendorId: number; stock?: number; isAvailable?: boolean; date?: string }) => 
    api.post<MenuItem>('/menu-items', menuItem),
  update: (id: number, menuItem: { itemName: string; description?: string; price: string; vendorId: number; stock?: number; isAvailable?: boolean; date?: string }) => 
    api.put<MenuItem>(`/menu-items/${id}`, menuItem),
  delete: (id: number) => api.delete(`/menu-items/${id}`),
  deleteAvailability: (id: number, date: string) => api.delete(`/menu-items/${id}/availability?date=${encodeURIComponent(date)}`),
  getByVendor: (vendorId: number) => api.get<MenuItem[]>(`/menu-items/vendor/${vendorId}/today`),
};

export const orderService = {
  getById: (id: number) => api.get<Order>(`/orders/${id}`),
  getByUserId: (userId: number) => api.get<Order[]>(`/orders/user/${userId}`),
  getByVendorId: (vendorId: number) => api.get<Order[]>(`/orders/vendor/${vendorId}`),
  create: (order: { userId: number; vendorId: number; paymentMethod: string; items: OrderItem[] }) => 
    api.post<Order>('/orders', order),
  markAsReady: (orderId: number) => api.post<Order>(`/orders/${orderId}/ready`),
  markAsCompleted: (orderId: number) => api.post<Order>(`/orders/${orderId}/complete`),
  cancel: (orderId: number) => api.delete<Order>(`/orders/${orderId}`),
};

export interface YapePaymentRequest {
  token: string;
  payerEmail: string;
  phoneNumber?: string;
}

export interface MercadoPagoPaymentResponse {
  preferenceId: string;
  paymentUrl: string;
  qrCode?: string;
  total: number;
  paymentMethod: string;
}

export const paymentService = {
  generateYapeToken: (phoneNumber: string, otp: string) =>
    api.post<string>(`/payment/yape/token?phoneNumber=${encodeURIComponent(phoneNumber)}&otp=${encodeURIComponent(otp)}`),
  
  createYapePayment: (orderId: number, token: string, payerEmail: string) =>
    api.post<MercadoPagoPaymentResponse>(`/payment/yape/${orderId}`, {
      token,
      payerEmail,
    } as YapePaymentRequest),
};

export const feedbackService = {
  getAll: () => api.get<Feedback[]>('/feedback'),
  getByMenuItem: (menuItemId: number) => api.get<Feedback[]>(`/feedback/item/${menuItemId}`),
  getByUser: (userId: number) => api.get<Feedback[]>(`/feedback/user/${userId}`),
  getByVendor: (vendorId: number) => api.get<Feedback[]>(`/feedback/vendor/${vendorId}`),
  create: (feedback: { rating: number; comment?: string; userId: number; orderId: number; menuItemId: number }) => 
    api.post<Feedback>('/feedback', feedback),
};

export const vendorService = {
  getAll: () => api.get<Vendor[]>('/vendors'),
  getById: (id: number) => api.get<Vendor>(`/vendors/${id}`),
  create: (vendor: { name: string; ubication?: string; openingTime?: string; closingTime?: string }) => 
    api.post<Vendor>('/vendors', vendor),
  update: (id: number, vendor: { name: string; ubication?: string; openingTime?: string; closingTime?: string }) =>
    api.put<Vendor>(`/vendors/${id}`, vendor),
  delete: (id: number) => api.delete(`/vendors/${id}`),
};

export interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalVendors: number;
  totalRegularUsers: number;
  totalVendorsEntities: number;
  totalMenuItems: number;
  totalOrders: number;
  totalOrdersToday: number;
  totalOrdersThisWeek: number;
  totalFeedback: number;
}

export const dashboardService = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats'),
};

export default api;
