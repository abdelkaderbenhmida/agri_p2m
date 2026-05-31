import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MessageService } from '../../../core/services/message.service';
import { Order, OrderStatus } from '../../../core/models/order.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-farmer-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './farmer-orders.component.html',
  styleUrl: './farmer-orders.component.css'
})
export class FarmerOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  selectedOrder: Order | null = null;
  currentFilter: OrderStatus | 'ALL' = 'ALL';

  private orderMap: L.Map | null = null;

  orderStatuses = [
    { value: 'ALL' as const, label: 'Toutes', count: 0 },
    { value: OrderStatus.PENDING, label: 'En attente', count: 0 },
    { value: OrderStatus.CONFIRMED, label: 'Confirmées', count: 0 },
    { value: OrderStatus.PREPARING, label: 'En préparation', count: 0 },
    { value: OrderStatus.READY, label: 'Prêtes', count: 0 },
    { value: OrderStatus.DELIVERED, label: 'Livrées', count: 0 },
    { value: OrderStatus.CANCELLED, label: 'Annulées', count: 0 }
  ];

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private toastService: ToastService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    const user = this.authService.getCurrentUser();
    
    if (!user) return;

    this.orderService.getFarmerOrders(user.id).subscribe({
      next: (orders) => {
        this.orders = orders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.updateOrderCounts();
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.toastService.error('Erreur lors du chargement des commandes');
        this.loading = false;
      }
    });
  }

  updateOrderCounts() {
    this.orderStatuses[0].count = this.orders.length;
    this.orderStatuses[1].count = this.orders.filter(o => o.status === OrderStatus.PENDING).length;
    this.orderStatuses[2].count = this.orders.filter(o => o.status === OrderStatus.CONFIRMED).length;
    this.orderStatuses[3].count = this.orders.filter(o => o.status === OrderStatus.PREPARING).length;
    this.orderStatuses[4].count = this.orders.filter(o => o.status === OrderStatus.READY).length;
    this.orderStatuses[5].count = this.orders.filter(o => o.status === OrderStatus.DELIVERED).length;
    this.orderStatuses[6].count = this.orders.filter(o => o.status === OrderStatus.CANCELLED).length;
  }

  setFilter(filter: OrderStatus | 'ALL') {
    this.currentFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    if (this.currentFilter === 'ALL') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(o => o.status === this.currentFilter);
    }
  }

  viewOrderDetails(order: Order) {
    this.selectedOrder = order;
    setTimeout(() => this.initOrderMap(order), 250);
  }

  closeDetails() {
    this.selectedOrder = null;
    if (this.orderMap) {
      this.orderMap.remove();
      this.orderMap = null;
    }
  }

  initOrderMap(order: Order): void {
    const addr = order.deliveryAddress as any;
    if (!addr?.latitude || !addr?.longitude) return;
    const mapEl = document.getElementById('order-location-map');
    if (!mapEl) return;
    if (this.orderMap) { this.orderMap.remove(); this.orderMap = null; }
    this.orderMap = L.map('order-location-map').setView([addr.latitude, addr.longitude], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.orderMap);
    const clientInfo = this.parseDeliveryNotes(order.deliveryNotes);
    L.marker([addr.latitude, addr.longitude])
      .addTo(this.orderMap)
      .bindPopup(`<b>${clientInfo.name || order.buyerName || 'Client'}</b><br>${addr.street || ''}, ${addr.city || ''}`)
      .openPopup();
  }

  parseDeliveryNotes(notes?: string): { name: string; phone: string; extra: string } {
    if (!notes) return { name: '', phone: '', extra: '' };
    const parts = notes.split(' | ');
    return { name: parts[0] || '', phone: parts[1] || '', extra: parts.slice(2).join(' | ') };
  }

  ngOnDestroy(): void {
    if (this.orderMap) { this.orderMap.remove(); this.orderMap = null; }
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          order.status = newStatus;
          this.updateOrderCounts();
          this.applyFilter();
        }
        this.toastService.success('Statut de commande mis à jour');
        if (this.selectedOrder?.id === orderId) {
          this.selectedOrder.status = newStatus;
        }
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        this.toastService.error('Erreur lors de la mise à jour');
      }
    });
  }

  canUpdateTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const statusOrder = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.DELIVERED
    ];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);
    
    return newIndex === currentIndex + 1;
  }

  getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
    const statusFlow: { [key in OrderStatus]?: OrderStatus } = {
      [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
      [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
      [OrderStatus.PREPARING]: OrderStatus.READY,
      [OrderStatus.READY]: OrderStatus.DELIVERED
    };
    
    return statusFlow[currentStatus] || null;
  }

  getNextStatusLabel(currentStatus: OrderStatus): string {
    const nextStatus = this.getNextStatus(currentStatus);
    if (!nextStatus) return '';
    
    const statusLabels: { [key in OrderStatus]: string } = {
      [OrderStatus.PENDING]: 'En attente',
      [OrderStatus.CONFIRMED]: 'Confirmer',
      [OrderStatus.PREPARING]: 'Marquer en préparation',
      [OrderStatus.READY]: 'Marquer comme prête',
      [OrderStatus.PROCESSING]: 'En traitement',
      [OrderStatus.SHIPPED]: 'Expédier',
      [OrderStatus.DELIVERED]: 'Marquer comme livrée',
      [OrderStatus.CANCELLED]: 'Annuler',
      [OrderStatus.REFUNDED]: 'Remboursée'
    };
    
    return statusLabels[nextStatus];
  }

  advanceOrderStatus(orderId: string, currentStatus: OrderStatus) {
    const nextStatus = this.getNextStatus(currentStatus);
    if (nextStatus) {
      this.updateOrderStatus(orderId, nextStatus);
    }
  }

  cancelOrder(orderId: string) {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande?')) {
      this.updateOrderStatus(orderId, OrderStatus.CANCELLED);
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatTime(date: string | Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  printPackingSlip(order: Order) {
    // Generate a packing slip and trigger download/print
    const packingSlipContent = this.generatePackingSlipHTML(order);
    const blob = new Blob([packingSlipContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    this.toastService.success('Bordereau de livraison généré');
  }

  contactCustomer(order: Order) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !order.buyerId || !order.buyerName) {
      this.toastService.error('Informations client manquantes');
      return;
    }

    // Create or navigate to conversation with the customer
    this.messageService.createConversation(
      order.buyerId,
      order.buyerName,
      currentUser.id,
      `${currentUser.firstName} ${currentUser.lastName}`,
      undefined,
      undefined
    ).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
        this.toastService.success('Redirection vers la messagerie');
      },
      error: () => {
        this.toastService.error('Erreur lors de la création de la conversation');
      }
    });
  }

  private generatePackingSlipHTML(order: Order): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bordereau de Livraison ${order.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .section { margin: 20px 0; }
    .section h3 { background-color: #f0f0f0; padding: 8px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #333; color: white; }
    .signature { margin-top: 40px; border-top: 1px solid #000; width: 200px; padding-top: 5px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>BORDEREAU DE LIVRAISON</h1>
    <p><strong>Commande #${order.id}</strong></p>
    <p>Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
  </div>
  
  <div class="section">
    <h3>Expéditeur (Fermier)</h3>
    <p><strong>${order.farmerName}</strong></p>
  </div>

  <div class="section">
    <h3>Destinataire</h3>
    <p><strong>Nom:</strong> ${order.buyerName}</p>
    <p><strong>Adresse de livraison:</strong> ${order.deliveryAddress}</p>
  </div>

  <div class="section">
    <h3>Articles à livrer</h3>
    <table>
      <thead>
        <tr>
          <th>N°</th>
          <th>Produit</th>
          <th>Quantité</th>
          <th>Vérification</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.productName}</td>
            <td>${item.quantity} ${item.unit || 'kg'}</td>
            <td style="width: 50px; text-align: center;">☐</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h3>Informations de livraison</h3>
    <p><strong>Date de livraison prévue:</strong> ${order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString('fr-FR') : 'À définir'}</p>
    <p><strong>Statut:</strong> ${this.getStatusLabel(order.status)}</p>
    <p><strong>Instructions spéciales:</strong> ${order.deliveryNotes || 'Aucune'}</p>
  </div>

  <div class="section">
    <p><strong>Nombre total de colis:</strong> ${order.items.length}</p>
  </div>

  <div class="section">
    <p>Signature du livreur:</p>
    <div class="signature"></div>
    <br>
    <p>Signature du destinataire:</p>
    <div class="signature"></div>
    <p style="font-size: 12px; color: #666;">Date et heure de réception: _________________</p>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Imprimer</button>
  </div>
</body>
</html>
    `;
  }

  private getStatusLabel(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'En attente',
      [OrderStatus.CONFIRMED]: 'Confirmée',
      [OrderStatus.PREPARING]: 'En préparation',
      [OrderStatus.READY]: 'Prête',
      [OrderStatus.PROCESSING]: 'Traitement',
      [OrderStatus.SHIPPED]: 'En livraison',
      [OrderStatus.DELIVERED]: 'Livrée',
      [OrderStatus.CANCELLED]: 'Annulée',
      [OrderStatus.REFUNDED]: 'Remboursée'
    };
    return statusMap[status] || status;
  }
}
