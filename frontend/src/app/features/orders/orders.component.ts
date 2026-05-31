import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="orders-page">
      <div class="container">
        <h1>Mes Commandes</h1>
        
        <div *ngIf="loading" class="loading">Chargement...</div>
        
        <div *ngIf="!loading && orders.length === 0" class="text-center mt-3">
          <p>Vous n'avez pas encore de commandes</p>
        </div>
        
        <div class="orders-list">
          <div *ngFor="let order of orders" class="order-card card">
            <div class="order-header">
              <h3>Commande #{{ order.orderNumber }}</h3>
              <span class="status" [class]="order.status.toLowerCase()">
                {{ getStatusLabel(order.status) }}
              </span>
            </div>
            
            <div class="order-details">
              <p><strong>Date:</strong> {{ order.createdAt | date:'dd/MM/yyyy' }}</p>
              <p><strong>Total:</strong> {{ order.totalAmount }}€</p>
              <p><strong>Articles:</strong> {{ order.items.length }}</p>
            </div>
            
            <div class="order-items">
              <div *ngFor="let item of order.items" class="order-item">
                <span>{{ item.productName }} x{{ item.quantity }}</span>
                <span>{{ item.subtotal }}€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-page {
      padding: 24px 0;
    }
    
    .orders-list {
      margin-top: 24px;
    }
    
    .order-card {
      margin-bottom: 16px;
    }
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .status {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .status.pending { background: #fff3e0; color: #f57c00; }
    .status.confirmed { background: #e3f2fd; color: #1976d2; }
    .status.shipped { background: #e8f5e9; color: #388e3c; }
    .status.delivered { background: #c8e6c9; color: #2e7d32; }
    
    .order-items {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }
    
    .order-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  
  constructor(private orderService: OrderService) {}
  
  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders', error);
        this.loading = false;
      }
    });
  }
  
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmée',
      'PROCESSING': 'En préparation',
      'SHIPPED': 'Expédiée',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée'
    };
    return labels[status] || status;
  }
}
