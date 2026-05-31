import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { AuthService } from '../../../core/services/auth.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { MapViewComponent } from '../../../shared/components/map-view/map-view.component';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SkeletonComponent, MapViewComponent],
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.css'
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  loading = true;
  selectedOrder: Order | null = null;
  activeFilter: string = 'all';

  // Live tracking
  trackingActive = false;
  trackingOrderId: string | null = null;
  trackingTimer: any = null;
  destinationLat: number | null = null;
  destinationLng: number | null = null;
  driverLat: number | null = null;
  driverLng: number | null = null;
  geocodingInProgress = false;

  // Rating modal
  showRatingModal = false;
  ratingOrder: Order | null = null;
  selectedRating = 0;
  reviewInputText = '';
  ratingSubmitting = false;

  // Payment modal
  showPaymentModal = false;
  paymentOrder: Order | null = null;
  selectedPaymentMethod = 'cash';
  paymentSubmitting = false;

  // Card form fields
  cardNumber = '';
  cardName = '';
  cardExpiry = '';
  cardCvv = '';
  cvvFocused = false;

  get cardNumberDisplay(): string {
    return this.cardNumber || '•••• •••• •••• ••••';
  }
  get cardNameDisplay(): string {
    return this.cardName.toUpperCase() || 'NOM PRÉNOM';
  }
  get cardExpiryDisplay(): string {
    return this.cardExpiry || 'MM/AA';
  }
  get cardType(): string {
    const n = this.cardNumber.replace(/\s/g, '');
    if (n.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'MASTERCARD';
    if (n.startsWith('6')) return 'e-DINAR';
    return '';
  }

  isCardValid(): boolean {
    return this.cardNumber.replace(/\s/g, '').length === 16
      && this.cardName.trim().length >= 3
      && this.cardExpiry.length === 5
      && this.cardCvv.length >= 3;
  }

  formatCardNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.cardNumber = val;
    input.value = val;
  }

  formatExpiry(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2);
    this.cardExpiry = val;
    input.value = val;
  }

  get pendingPaymentCount(): number {
    return this.orders.filter(o => o.status === OrderStatus.CONFIRMED).length;
  }

  orderStatuses = [
    { value: OrderStatus.PENDING,    label: 'En attente',              color: 'yellow', icon: '🕐' },
    { value: OrderStatus.CONFIRMED,  label: 'Acceptée',                color: 'blue',   icon: '✅' },
    { value: OrderStatus.PROCESSING, label: 'En préparation',          color: 'purple', icon: '📦' },
    { value: OrderStatus.SHIPPED,    label: 'En livraison',            color: 'indigo', icon: '🚛' },
    { value: OrderStatus.DELIVERED,  label: 'Livrée',                  color: 'green',  icon: '🎉' },
    { value: OrderStatus.CANCELLED,  label: 'Annulée',                 color: 'red',    icon: '✕'  }
  ];

  get filteredOrders(): Order[] {
    if (this.activeFilter === 'all') return this.orders;
    if (this.activeFilter === 'active') return this.orders.filter(o =>
      [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING].includes(o.status as OrderStatus));
    if (this.activeFilter === 'shipping') return this.orders.filter(o => o.status === OrderStatus.SHIPPED);
    if (this.activeFilter === 'delivered') return this.orders.filter(o => o.status === OrderStatus.DELIVERED);
    if (this.activeFilter === 'cancelled') return this.orders.filter(o => o.status === OrderStatus.CANCELLED);
    return this.orders;
  }

  countByFilter(filter: string): number {
    if (filter === 'all') return this.orders.length;
    if (filter === 'active') return this.orders.filter(o =>
      [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING].includes(o.status as OrderStatus)).length;
    if (filter === 'shipping') return this.orders.filter(o => o.status === OrderStatus.SHIPPED).length;
    if (filter === 'delivered') return this.orders.filter(o => o.status === OrderStatus.DELIVERED).length;
    if (filter === 'cancelled') return this.orders.filter(o => o.status === OrderStatus.CANCELLED).length;
    return 0;
  }

  getStepIndex(status: OrderStatus): number {
    const flow = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
    return flow.indexOf(status);
  }

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private cartService: CartService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
      }
    });
  }

  viewOrderDetails(order: Order) {
    this.selectedOrder = order;
    this.destinationLat = null;
    this.destinationLng = null;
    // Use departure coordinates if available (farmer shared location)
    this.driverLat = order.departureLat || order.driverCurrentLat || null;
    this.driverLng = order.departureLng || order.driverCurrentLng || null;
    const city = order.deliveryAddress?.city;
    if (city) this.geocodeCity(city);
  }

  openPayment(order: Order) {
    this.paymentOrder = order;
    this.selectedPaymentMethod = 'cash';
    this.cardNumber = '';
    this.cardName = '';
    this.cardExpiry = '';
    this.cardCvv = '';
    this.showPaymentModal = true;
  }

  closePayment() {
    this.showPaymentModal = false;
    this.paymentOrder = null;
    this.paymentSubmitting = false;
    this.cardNumber = '';
    this.cardName = '';
    this.cardExpiry = '';
    this.cardCvv = '';
  }

  processPayment() {
    if (!this.paymentOrder) return;

    if (this.selectedPaymentMethod === 'carte') {
      if (!this.isCardValid()) {
        this.toastService.error('Veuillez remplir tous les champs de la carte correctement.');
        return;
      }
      this.paymentSubmitting = true;
      // Simulate secure card processing (2.5s)
      setTimeout(() => this.confirmPaymentUpdate('Paiement par carte bancaire sécurisé'), 2500);
      return;
    }

    this.paymentSubmitting = true;
    const method = this.selectedPaymentMethod === 'cash' ? 'Paiement à la livraison' : 'Virement bancaire';
    this.confirmPaymentUpdate(`Paiement confirmé — ${method}`);
  }

  private confirmPaymentUpdate(description: string) {
    this.orderService.updateOrderStatus(this.paymentOrder!.id, OrderStatus.PROCESSING, description).subscribe({
        next: () => {
          const o = this.orders.find(x => x.id === this.paymentOrder!.id);
          if (o) o.status = OrderStatus.PROCESSING;
          if (this.selectedOrder?.id === this.paymentOrder!.id) this.selectedOrder.status = OrderStatus.PROCESSING;
        this.paymentSubmitting = false;
        this.toastService.success('Paiement confirmé ! L\'agriculteur va préparer votre commande.');
        this.closePayment();
      },
      error: () => { this.paymentSubmitting = false; this.toastService.error('Erreur lors du paiement'); }
    });
  }

  closeDetails() {
    this.selectedOrder = null;
    this.stopTracking();
  }

  getStatusInfo(status: OrderStatus) {
    return this.orderStatuses.find(s => s.value === status) || this.orderStatuses[0];
  }

  getStatusProgress(status: OrderStatus): number {
    const statusIndex = this.orderStatuses.findIndex(s => s.value === status);
    return ((statusIndex + 1) / this.orderStatuses.length) * 100;
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

  reorder(order: Order) {
    // Add all items from the order back to cart
    order.items.forEach(item => {
      // Assuming the item has product information
      const product = {
        id: item.productId,
        name: item.productName,
        price: item.price,
        // Add other required product fields with defaults
        images: [],
        description: '',
        category: '',
        unit: item.unit || 'kg',
        farmerId: order.farmerId,
        farmerName: order.farmerName,
        isOrganic: false,
        isAvailable: true,
        rating: 0,
        reviewCount: 0,
        stock: 100
      };
      this.cartService.addToCart(product as any, item.quantity);
    });
    this.toastService.success('Produits ajoutés au panier');
    this.router.navigate(['/cart']);
  }

  downloadInvoice(order: Order) {
    // Generate a simple invoice as text/HTML and trigger download
    const invoiceContent = this.generateInvoiceHTML(order);
    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facture-${order.id}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.toastService.success('Facture téléchargée');
  }

  private generateInvoiceHTML(order: Order): string {
    const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 5.00; // Example delivery fee
    const grandTotal = total + deliveryFee;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${order.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .info { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .total { text-align: right; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FACTURE</h1>
    <p>Commande #${order.id}</p>
    <p>Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
  </div>
  
  <div class="info">
    <h3>Informations Client</h3>
    <p><strong>Nom:</strong> ${order.buyerName}</p>
    <p><strong>Adresse de livraison:</strong> ${order.deliveryAddress}</p>
  </div>

  <div class="info">
    <h3>Informations Fermier</h3>
    <p><strong>Nom:</strong> ${order.farmerName}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produit</th>
        <th>Quantité</th>
        <th>Prix unitaire</th>
        <th>Sous-total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map(item => `
        <tr>
          <td>${item.productName}</td>
          <td>${item.quantity} ${item.unit || 'kg'}</td>
          <td>${item.price.toFixed(2)} €</td>
          <td>${(item.price * item.quantity).toFixed(2)} €</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total">
    <p>Sous-total: ${total.toFixed(2)} €</p>
    <p>Frais de livraison: ${deliveryFee.toFixed(2)} €</p>
    <h3>Total: ${grandTotal.toFixed(2)} €</h3>
  </div>

  <div class="info">
    <h3>Statut de la commande</h3>
    <p><strong>Statut actuel:</strong> ${this.getStatusLabel(order.status)}</p>
    <p><strong>Mode de paiement:</strong> ${order.paymentMethod}</p>
    <p><strong>Statut du paiement:</strong> ${order.paymentStatus}</p>
  </div>
</body>
</html>
    `;
  }
  getItemsSubtotal(order: Order): string {
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal.toFixed(2);
  }

  getDeliveryFee(order: Order): number {
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const fee = order.totalAmount - subtotal;
    return fee > 0 ? fee : 0;
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

  async geocodeCity(city: string) {
    this.geocodingInProgress = true;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Tunisie')}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        this.destinationLat = parseFloat(data[0].lat);
        this.destinationLng = parseFloat(data[0].lon);
      }
    } catch { /* ignore */ }
    this.geocodingInProgress = false;
  }

  startTracking(order: Order) {
    this.trackingActive = true;
    this.trackingOrderId = order.id;
    const poll = () => {
      this.orderService.getOrderById(order.id).subscribe({
        next: (o: Order) => {
          this.driverLat = o.driverCurrentLat || null;
          this.driverLng = o.driverCurrentLng || null;
          if (this.selectedOrder?.id === order.id) {
            (this.selectedOrder as any).driverCurrentLat = o.driverCurrentLat;
            (this.selectedOrder as any).driverCurrentLng = o.driverCurrentLng;
            (this.selectedOrder as any).lastDriverLocationUpdate = o.lastDriverLocationUpdate;
          }
        }
      });
    };
    poll();
    this.trackingTimer = setInterval(poll, 10000);
  }

  stopTracking() {
    this.trackingActive = false;
    this.trackingOrderId = null;
    this.driverLat = null;
    this.driverLng = null;
    if (this.trackingTimer) { clearInterval(this.trackingTimer); this.trackingTimer = null; }
  }

  isTrackable(order: Order): boolean {
    return order.status === OrderStatus.SHIPPED || order.status === OrderStatus.PROCESSING;
  }

  isReadyToConfirm(order: Order): boolean {
    return order.status === OrderStatus.SHIPPED;
  }

  isRatable(order: Order): boolean {
    return order.status === OrderStatus.DELIVERED && !order.rating;
  }

  confirmReceipt(order: Order): void {
    if (!confirm('Confirmez-vous avoir bien reçu cette commande ?')) return;
    this.orderService.confirmReceipt(order.id).subscribe({
      next: () => {
        order.status = OrderStatus.DELIVERED;
        if (this.selectedOrder?.id === order.id) this.selectedOrder.status = OrderStatus.DELIVERED;
        this.toastService.success('Réception confirmée ! Vous pouvez maintenant évaluer votre commande.');
        // auto-open rating modal
        setTimeout(() => this.openRating(order), 500);
      },
      error: () => this.toastService.error('Erreur lors de la confirmation')
    });
  }

  openRating(order: Order): void {
    this.ratingOrder = order;
    this.selectedRating = order.rating || 0;
    this.reviewInputText = order.reviewText || '';
    this.showRatingModal = true;
  }

  closeRating(): void {
    this.showRatingModal = false;
    this.ratingOrder = null;
    this.selectedRating = 0;
    this.reviewInputText = '';
  }

  setStarRating(n: number): void {
    this.selectedRating = n;
  }

  submitRating(): void {
    if (!this.ratingOrder || this.selectedRating === 0) {
      this.toastService.error('Veuillez sélectionner une note.');
      return;
    }
    this.ratingSubmitting = true;
    this.orderService.rateOrder(this.ratingOrder.id, this.selectedRating, this.reviewInputText).subscribe({
      next: () => {
        const order = this.orders.find(o => o.id === this.ratingOrder!.id);
        if (order) { order.rating = this.selectedRating; order.reviewText = this.reviewInputText; }
        if (this.selectedOrder?.id === this.ratingOrder!.id) {
          this.selectedOrder.rating = this.selectedRating;
          this.selectedOrder.reviewText = this.reviewInputText;
        }
        this.ratingSubmitting = false;
        this.toastService.success('Merci pour votre évaluation !');
        this.closeRating();
      },
      error: () => { this.ratingSubmitting = false; this.toastService.error('Erreur lors de l\'évaluation'); }
    });
  }

  ngOnDestroy() {
    this.stopTracking();
  }
}
