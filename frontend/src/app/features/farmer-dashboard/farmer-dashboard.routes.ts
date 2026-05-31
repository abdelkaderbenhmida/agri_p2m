import { Routes } from '@angular/router';

export const FARMER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./farmer-dashboard.component').then(m => m.FarmerDashboardComponent) },
  { path: 'add-product', loadComponent: () => import('./add-product/add-product.component').then(m => m.AddProductComponent) },
  { path: 'edit-product/:id', loadComponent: () => import('./add-product/add-product.component').then(m => m.AddProductComponent) },
  { path: 'orders', loadComponent: () => import('./farmer-orders/farmer-orders.component').then(m => m.FarmerOrdersComponent) }
];
