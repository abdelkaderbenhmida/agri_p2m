import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../core/models/order.model';

@Component({
  selector: 'app-buyer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './buyer-dashboard.component.html',
  styleUrl: './buyer-dashboard.component.css'
})
export class BuyerDashboardComponent implements OnInit {
  currentUser: any;
  recentOrders: Order[] = [];
  loading = true;
  
  stats = {
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  };

  constructor(
    private authService: AuthService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    
    this.orderService.getMyOrders().subscribe({
      next: (orders: Order[]) => {
        this.recentOrders = orders || [];
        this.calculateStats();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading orders:', error);
        this.recentOrders = [];
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.totalOrders = this.recentOrders.length;
    this.stats.pendingOrders = this.recentOrders.filter(o => 
      o.status === OrderStatus.PENDING || 
      o.status === OrderStatus.CONFIRMED || 
      o.status === OrderStatus.PROCESSING
    ).length;
    this.stats.completedOrders = this.recentOrders.filter(o => o.status === OrderStatus.DELIVERED).length;
    this.stats.totalSpent = this.recentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:    return 'En attente';
      case OrderStatus.CONFIRMED:  return 'Confirmée';
      case OrderStatus.PROCESSING: return 'En préparation';
      case OrderStatus.SHIPPED:    return 'Expédiée';
      case OrderStatus.DELIVERED:  return 'Livrée';
      case OrderStatus.CANCELLED:  return 'Annulée';
      case OrderStatus.REFUNDED:   return 'Remboursée';
      default: return status;
    }
  }

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
      case OrderStatus.CONFIRMED:
        return 'bg-orange-100 text-orange-700';
      case OrderStatus.PROCESSING:
      case OrderStatus.SHIPPED:
        return 'bg-blue-100 text-blue-700';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-700';
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
