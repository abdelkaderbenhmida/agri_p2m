export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  address?: Address;
  profileImage?: string;
  isVerified: boolean;
  isActive: boolean;
  farmerProfile?: FarmerProfile;
  favoriteProducts?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  FARMER = 'FARMER',
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface FarmerProfile {
  farmName: string;
  description: string;
  certifications?: string;
  rating: number;
  totalReviews: number;
  farmImage?: string;
  farmSize?: number;
  specialties: string[];
  farmLat?: number;
  farmLng?: number;
  farmAddress?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Address;
  farmerProfile?: FarmerProfile;
  profileImage?: string;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  address?: Address;
  farmName?: string;
  farmDescription?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  address?: Address;
  profileImage?: string;
  isVerified: boolean;
  isActive: boolean;
  farmerProfile?: FarmerProfile;
}
