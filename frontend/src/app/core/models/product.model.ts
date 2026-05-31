export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  unit: string;
  stock: number;
  images: string[];
  farmer?: any; // Farmer user object populated from backend
  farmerId: string;
  isOrganic: boolean;
  isAvailable: boolean;
  rating: number;
  totalReviews: number;
  reviews: ProductReview[];
  location: string;
  harvestDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductCategory {
  VEGETABLES = 'VEGETABLES',
  FRUITS = 'FRUITS',
  GRAINS = 'GRAINS',
  DAIRY = 'DAIRY',
  MEAT = 'MEAT',
  POULTRY = 'POULTRY',
  EGGS = 'EGGS',
  HONEY = 'HONEY',
  HERBS = 'HERBS',
  FLOWERS = 'FLOWERS',
  SEEDS = 'SEEDS',
  OTHER = 'OTHER'
}

export interface ProductReview {
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ProductRequest {
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  unit: string;
  stock: number;
  images?: string[];
  isOrganic: boolean;
  location: string;
  harvestDate?: Date;
}
