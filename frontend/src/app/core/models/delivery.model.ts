export interface DeliveryRoute {
  id?: string;
  // Farmer who posted the offer
  farmerId?: string;
  farmerName?: string;
  // Offer details
  description?: string;
  destination?: string;
  destinationLat?: number;
  destinationLng?: number;
  quantity?: number;
  quantityUnit?: string;
  transportPrice?: number;
  // Driver tracking
  driverCurrentLat?: number;
  driverCurrentLng?: number;
  lastLocationUpdate?: string;
  // Driver (set after acceptance)
  driverId?: string;
  driverName?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  stops?: DeliveryStop[];
  applications?: LogisticsApplication[];
  status?: RouteStatus;
  scheduledDate?: Date | string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  totalDistance?: number;
  totalOrders?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export enum RouteStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface DeliveryStop {
  orderId: string;
  customerName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  sequenceNumber: number;
  status: StopStatus;
  estimatedArrival?: Date | string;
  actualArrival?: Date | string;
  notes?: string;
  signature?: string;
}

export enum StopStatus {
  PENDING = 'PENDING',
  EN_ROUTE = 'EN_ROUTE',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RESCHEDULED = 'RESCHEDULED'
}

export interface LogisticsApplication {
  applicantId?: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  message?: string;
  vehicleType?: string;
  licenseNumber?: string;
  status?: LogisticsAppStatus;
  appliedAt?: string;
  notes?: string;
}

export enum LogisticsAppStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}
