import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { CreateOrderRequest, OrderItem } from '../../core/models/order.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  currentStep: 'cart' | 'delivery' | 'payment' = 'cart';
  loading = false;

  private deliveryMap: L.Map | null = null;
  private deliveryMarker: L.Marker | null = null;

  // Delivery form
  deliveryForm = {
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
    deliveryMethod: 'livraison' as 'livraison' | 'retrait',
    latitude: null as number | null,
    longitude: null as number | null
  };

  // Payment form
  paymentForm = {
    method: 'cash', // 'cash', 'card', 'mobile'
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: ''
  };

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: string): void {
    if (confirm('Êtes-vous sûr de vouloir retirer ce produit du panier ?')) {
      this.cartService.removeFromCart(productId);
    }
  }

  getSubtotal(): number {
    return this.cartService.getTotal();
  }

  getDeliveryFee(): number {
    return this.deliveryForm.deliveryMethod === 'livraison' ? 5.00 : 0;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getDeliveryFee();
  }

  proceedToDelivery(): void {
    if (this.cartItems.length === 0) {
      this.toastService.warning('Votre panier est vide !');
      return;
    }
    this.currentStep = 'delivery';
    window.scrollTo(0, 0);
    if (this.deliveryForm.deliveryMethod === 'livraison') {
      setTimeout(() => this.initDeliveryMap(), 300);
    }
  }

  onDeliveryMethodChange(): void {
    if (this.deliveryForm.deliveryMethod === 'livraison') {
      setTimeout(() => this.initDeliveryMap(), 300);
    } else {
      if (this.deliveryMap) {
        this.deliveryMap.remove();
        this.deliveryMap = null;
        this.deliveryMarker = null;
      }
    }
  }

  initDeliveryMap(): void {
    if (this.deliveryMap) {
      this.deliveryMap.remove();
      this.deliveryMap = null;
      this.deliveryMarker = null;
    }
    const mapEl = document.getElementById('delivery-map');
    if (!mapEl) return;
    // Center on Tunisia
    this.deliveryMap = L.map('delivery-map').setView([33.8869, 9.5375], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.deliveryMap);
    this.deliveryMap.on('click', (e: L.LeafletMouseEvent) => {
      this.pickDeliveryLocation(e.latlng.lat, e.latlng.lng);
    });
    // If already have a position, show it
    if (this.deliveryForm.latitude && this.deliveryForm.longitude) {
      this.deliveryMarker = L.marker([this.deliveryForm.latitude, this.deliveryForm.longitude]).addTo(this.deliveryMap);
      this.deliveryMap.setView([this.deliveryForm.latitude, this.deliveryForm.longitude], 14);
    }
  }

  pickDeliveryLocation(lat: number, lng: number): void {
    this.deliveryForm.latitude = lat;
    this.deliveryForm.longitude = lng;
    if (this.deliveryMarker) {
      this.deliveryMarker.setLatLng([lat, lng]);
    } else if (this.deliveryMap) {
      this.deliveryMarker = L.marker([lat, lng]).addTo(this.deliveryMap);
    }
    // Reverse geocode with Nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(r => r.json())
      .then((data: any) => {
        if (data?.address) {
          const a = data.address;
          const road = [a.road, a.house_number].filter(Boolean).join(' ');
          if (!this.deliveryForm.address && road) this.deliveryForm.address = road;
          if (!this.deliveryForm.city) {
            this.deliveryForm.city = a.city || a.town || a.village || a.county || a.state || '';
          }
          if (!this.deliveryForm.postalCode && a.postcode) {
            this.deliveryForm.postalCode = a.postcode;
          }
        }
      })
      .catch(() => {});
  }

  proceedToPayment(): void {
    if (!this.deliveryForm.fullName || !this.deliveryForm.phone || !this.deliveryForm.address || !this.deliveryForm.city) {
      this.toastService.warning('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (this.deliveryForm.deliveryMethod === 'livraison' && !this.deliveryForm.latitude) {
      this.toastService.warning('Veuillez sélectionner votre position sur la carte');
      return;
    }
    this.currentStep = 'payment';
    window.scrollTo(0, 0);
  }

  placeOrder(): void {
    // Validate payment form
    if (this.paymentForm.method === 'card') {
      if (!this.paymentForm.cardNumber || !this.paymentForm.cardName || !this.paymentForm.cardExpiry || !this.paymentForm.cardCvv) {
        this.toastService.warning('Veuillez remplir toutes les informations de paiement');
        return;
      }
    }

    this.loading = true;

    // Prepare order items
    const orderItems: OrderItem[] = this.cartItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      farmerId: item.product.farmerId,
      farmerName: item.product.farmer
        ? `${item.product.farmer.firstName || ''} ${item.product.farmer.lastName || ''}`.trim()
        : '',
      quantity: item.quantity,
      price: item.product.price,
      unit: item.product.unit
    }));

    // Prepare order request
    const orderRequest: CreateOrderRequest = {
      items: orderItems,
      deliveryAddress: {
        street: this.deliveryForm.address,
        city: this.deliveryForm.city,
        zipCode: this.deliveryForm.postalCode,
        country: 'Tunisie',
        latitude: this.deliveryForm.latitude ?? undefined,
        longitude: this.deliveryForm.longitude ?? undefined
      } as any,
      deliveryNotes: `${this.deliveryForm.fullName} | ${this.deliveryForm.phone}${this.deliveryForm.notes ? ' | ' + this.deliveryForm.notes : ''}`,
      paymentMethod: this.paymentForm.method,
      totalAmount: this.getTotal()
    };

    // Send order to backend
    this.orderService.createOrder(orderRequest).subscribe({
      next: (response) => {
        this.loading = false;
        this.cartService.clearCart();
        this.toastService.success('Commande passée avec succès ! Merci pour votre achat.');
        this.router.navigate(['/my-orders']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating order:', error);
        this.toastService.error('Erreur lors de la création de la commande. Veuillez réessayer.');
      }
    });
  }

  backToCart(): void {
    this.currentStep = 'cart';
  }

  backToDelivery(): void {
    this.currentStep = 'delivery';
  }

  continueShopping(): void {
    this.router.navigate(['/marketplace']);
  }

  ngOnDestroy(): void {
    if (this.deliveryMap) {
      this.deliveryMap.remove();
      this.deliveryMap = null;
    }
  }
}
