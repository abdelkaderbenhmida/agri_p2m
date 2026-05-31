import { Address } from './user.model';

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  address: string;
  street?: string;
  city: string;
  postalCode?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerId?: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  farmerId?: string;
  farmerName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod: PaymentMethod | string;
  deliveryAddress?: DeliveryAddress;
  deliveryNotes?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  trackingHistory?: OrderTracking[];
  // Live driver location tracking
  driverCurrentLat?: number;
  driverCurrentLng?: number;
  lastDriverLocationUpdate?: string;
  // Customer receipt & rating
  rating?: number;
  reviewText?: string;
  // Transporter departure info
  departureDate?: string;
  departureLocation?: string;
  departureLat?: number;
  departureLng?: number;
  transporterName?: string;
  createdAt: Date | string;
  updatedAt?: Date;
}

export interface OrderItem {
  productId: string;
  productName?: string;
  farmerId?: string;
  farmerName?: string;
  quantity: number;
  price: number;
  unit?: string;
  subtotal?: number;
  productImage?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export interface OrderTracking {
  status: OrderStatus;
  description: string;
  timestamp: Date;
  location?: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  paymentMethod: string;
  totalAmount: number;
  deliveryNotes?: string;
}
