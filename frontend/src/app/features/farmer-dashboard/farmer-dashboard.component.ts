import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { FarmerService } from '../../core/services/farmer.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { JobService } from '../../core/services/job.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/product.model';
import { Order, OrderStatus } from '../../core/models/order.model';
import { JobOffer, JobStatus, ContractType } from '../../core/models/job.model';
import { DeliveryRoute, RouteStatus } from '../../core/models/delivery.model';
import { User } from '../../core/models/user.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { MapPickerComponent, MapLocation } from '../../shared/components/map-picker/map-picker.component';
import { MapViewComponent } from '../../shared/components/map-view/map-view.component';
import { Chart, registerables } from 'chart.js';
import * as L from 'leaflet';

Chart.register(...registerables);

@Component({
  selector: 'app-farmer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent, SkeletonComponent, MapPickerComponent, MapViewComponent],
  templateUrl: './farmer-dashboard.component.html',
  styleUrl: './farmer-dashboard.component.css'
})
export class FarmerDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productsChart') productsChartRef!: ElementRef<HTMLCanvasElement>;
  
  products: Product[] = [];
  loading = true;
  currentFilter: 'all' | 'low-stock' | 'out-stock' = 'all';
  currentSection: 'overview' | 'products' | 'orders' | 'messages' | 'logistics' | 'recruitment' | 'payments' | 'settings' | 'profile' = 'overview';
  currentUser: User | null = null;
  
  // Charts
  salesChart: any;
  productsChart: any;
  
  // Stats
  stats = {
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    averageRating: 0,
    totalRevenue: 0,
    ordersThisMonth: 0
  };

  recentOrders: Order[] = [];
  allOrders: Order[] = [];
  selectedOrder: Order | null = null;
  private orderDetailsMap: L.Map | null = null;

  // GPS Location sharing for order delivery
  sharingOrderId: string | null = null;
  locationShareTimer: any = null;

  // Departure form for farmer/transporter assignment
  departureForm: { date: string; location: string; transporterName: string } = { date: '', location: '', transporterName: '' };
  departureSubmitting = false;
  weeklySalesData: number[] = [0, 0, 0, 0, 0, 0, 0]; // Lun-Dim
  topProductsLabels: string[] = [];
  topProductsData: number[] = [];
  unreadMessages = 0;
  uniqueCustomers = 0;

  // Jobs
  myJobOffers: JobOffer[] = [];
  jobsLoading = false;
  JobStatus = JobStatus;
  ContractType = ContractType;

  // Delivery / logistics offers
  myRoutes: DeliveryRoute[] = [];
  routesLoading = false;
  RouteStatus = RouteStatus;
  showCreateOfferModal = false;
  savingOffer = false;
  offerForm = { destination: '', quantity: 0, quantityUnit: 'kg', scheduledDate: '', transportPrice: 0, description: '', destinationLat: 0, destinationLng: 0 };
  selectedRouteForApplications: DeliveryRoute | null = null;
  showApplicationsModal = false;
  updatingAppIndex: number | null = null;

  // Farm edit
  editingFarm = false;
  savingFarm = false;
  farmForm = { farmName: '', farmSize: 0, specialties: '', certifications: '', description: '', farmLat: 0, farmLng: 0, farmAddress: '' };

  // Image saving state
  savingBanner = false;
  savingPhoto = false;

  constructor(
    private productService: ProductService,
    private farmerService: FarmerService,
    private orderService: OrderService,
    private authService: AuthService,
    private messageService: MessageService,
    private jobService: JobService,
    private deliveryService: DeliveryService,
    private toastService: ToastService,
    private sanitizer: DomSanitizer,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadFarmerProducts();
    this.loadFarmerOrders();
    this.loadMyJobOffers();
    this.loadMyRoutes();
    this.messageService.getConversations().subscribe();
    this.messageService.unreadCount$.subscribe(count => {
      this.unreadMessages = count;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createSalesChart();
      this.createProductsChart();
    }, 100);
  }

  createSalesChart(): void {
    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          datasets: [{
            label: 'Ventes (TND)',
            data: this.weeklySalesData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1f2937',
              padding: 12,
              cornerRadius: 8,
              titleColor: '#fff',
              bodyColor: '#fff'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: (value) => value + ' TND'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
  }

  createProductsChart(): void {
    const ctx = this.productsChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.productsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.topProductsLabels,
          datasets: [{
            label: 'Ventes',
            data: this.topProductsData,
            backgroundColor: '#f97316',
            borderRadius: 8,
            barThickness: 50
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1f2937',
              padding: 12,
              cornerRadius: 8,
              titleColor: '#fff',
              bodyColor: '#fff'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
  }

  loadFarmerProducts(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser && currentUser.id) {
      this.farmerService.getMyProducts(currentUser.id).subscribe({
        next: (products: Product[]) => {
          this.products = products;
          this.calculateStats();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading products', error);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  deleteProduct(productId: string): void {
    if (!confirm('\u00cates-vous s\u00fbr de vouloir supprimer ce produit ?')) return;
    this.productService.deleteProduct(productId).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== productId);
      },
      error: (err: any) => {
        console.error('Error deleting product', err);
        alert('Erreur lors de la suppression du produit.');
      }
    });
  }

  loadFarmerOrders(): void {
    this.orderService.getMyFarmerOrders().subscribe({
      next: (orders: Order[]) => {
        this.allOrders = orders;
        this.recentOrders = orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        this.calculateOrderStats(orders);
        this.calculateWeeklySales(orders);
        this.calculateTopProducts(orders);
        this.calculateUniqueCustomers(orders);
        this.updateSalesChart();
        this.updateProductsChart();
      },
      error: (error: any) => {
        console.error('Error loading farmer orders', error);
      }
    });
  }

  calculateOrderStats(orders: Order[]): void {
    // Calculate total revenue from all orders
    this.stats.totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Calculate orders this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.stats.ordersThisMonth = orders.filter(order => 
      new Date(order.createdAt) >= firstDayOfMonth
    ).length;
  }

  calculateWeeklySales(orders: Order[]): void {
    // Initialize weekly sales data (Monday to Sunday)
    this.weeklySalesData = [0, 0, 0, 0, 0, 0, 0];
    
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const diffTime = orderDate.getTime() - monday.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // If order is from this week (0-6 days from Monday)
      if (diffDays >= 0 && diffDays < 7) {
        this.weeklySalesData[diffDays] += order.totalAmount;
      }
    });
  }

  updateSalesChart(): void {
    if (this.salesChart) {
      this.salesChart.data.datasets[0].data = this.weeklySalesData;
      this.salesChart.update();
    }
  }

  calculateTopProducts(orders: Order[]): void {
    const salesMap = new Map<string, number>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const name = item.productName || item.productId;
        salesMap.set(name, (salesMap.get(name) || 0) + item.quantity);
      });
    });
    const sorted = Array.from(salesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    this.topProductsLabels = sorted.map(e => e[0]);
    this.topProductsData = sorted.map(e => e[1]);
  }

  updateProductsChart(): void {
    if (this.productsChart) {
      this.productsChart.data.labels = this.topProductsLabels.length > 0 ? this.topProductsLabels : ['Aucune vente'];
      this.productsChart.data.datasets[0].data = this.topProductsData.length > 0 ? this.topProductsData : [0];
      this.productsChart.update();
    }
  }

  calculateUniqueCustomers(orders: Order[]): void {
    const ids = new Set(orders.map(o => o.buyerId || o.customerId).filter(Boolean));
    this.uniqueCustomers = ids.size;
  }

  getMemberSince(): string {
    if (!this.currentUser?.createdAt) return '-';
    const d = new Date(this.currentUser.createdAt);
    return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  }

  getAverageRating(): string {
    const rating = this.currentUser?.farmerProfile?.rating ?? this.stats.averageRating;
    return rating > 0 ? (rating).toFixed(1) + '/5' : '-/5';
  }

  getTotalReviews(): number {
    return this.currentUser?.farmerProfile?.totalReviews ?? 0;
  }

  getMonthlyRevenue(): number {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.allOrders
      .filter(o => new Date(o.createdAt) >= firstDay)
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }

  getPendingRevenue(): number {
    return this.allOrders
      .filter(o => o.paymentStatus === 'PENDING' || !o.paymentStatus)
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }

  getPendingPaymentsCount(): number {
    return this.allOrders.filter(o => o.paymentStatus === 'PENDING' || !o.paymentStatus).length;
  }

  calculateStats(): void {
    this.stats.totalProducts = this.products.length;
    this.stats.lowStock = this.products.filter(p => p.stock && p.stock > 0 && p.stock <= 5).length;
    this.stats.outOfStock = this.products.filter(p => !p.stock || p.stock === 0).length;
    
    const totalRating = this.products.reduce((sum, p) => sum + (p.rating || 0), 0);
    this.stats.averageRating = totalRating / this.products.length || 0;
  }

  get filteredProducts(): Product[] {
    let filtered = [...this.products];

    switch (this.currentFilter) {
      case 'low-stock':
        filtered = filtered.filter(p => p.stock && p.stock > 0 && p.stock <= 5);
        break;
      case 'out-stock':
        filtered = filtered.filter(p => !p.stock || p.stock === 0);
        break;
    }

    return filtered;
  }

  setFilter(filter: 'all' | 'low-stock' | 'out-stock'): void {
    this.currentFilter = filter;
  }

  changeSection(section: 'overview' | 'products' | 'orders' | 'messages' | 'logistics' | 'recruitment' | 'payments' | 'settings' | 'profile'): void {
    this.currentSection = section;
  }

  // ── RECRUTEMENT ──────────────────────────────────────────────────────────

  loadMyJobOffers(): void {
    this.jobsLoading = true;
    this.jobService.getMyJobOffers().subscribe({
      next: (res: any) => {
        this.myJobOffers = (res.jobs || res.data || (Array.isArray(res) ? res : [])) as JobOffer[];
        this.jobsLoading = false;
      },
      error: () => { this.jobsLoading = false; }
    });
  }

  deleteJobOffer(id: string): void {
    if (!confirm('Supprimer cette offre ?')) return;
    this.jobService.deleteJobOffer(id).subscribe({
      next: () => this.loadMyJobOffers(),
      error: () => alert('Erreur lors de la suppression')
    });
  }

  navigateToCreateJob(): void {
    this.router.navigate(['/jobs/create']);
  }

  navigateToEditJob(id: string): void {
    this.router.navigate(['/jobs/edit', id]);
  }

  getJobStatusLabel(status: JobStatus): string {
    const map: Record<string, string> = {
      OPEN: 'Active', CLOSED: 'Fermée', FILLED: 'Pourvue'
    };
    return map[status] || status;
  }

  getJobStatusClass(status: JobStatus): string {
    const map: Record<string, string> = {
      OPEN: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-700',
      FILLED: 'bg-blue-100 text-blue-700'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }

  getContractLabel(type: ContractType): string {
    const map: Record<string, string> = {
      FULL_TIME: 'Temps plein', PART_TIME: 'Temps partiel',
      CONTRACT: 'Contrat', INTERNSHIP: 'Stage'
    };
    return map[type] || type;
  }

  // ── LOGISTIQUE ────────────────────────────────────────────────────────────

  loadMyRoutes(): void {
    this.routesLoading = true;
    this.deliveryService.getMyFarmerOffers().subscribe({
      next: (res: any) => {
        this.myRoutes = (res.routes || res.data || (Array.isArray(res) ? res : [])) as DeliveryRoute[];
        this.routesLoading = false;
      },
      error: () => { this.routesLoading = false; }
    });
  }

  openCreateOffer(): void {
    this.offerForm = { destination: '', quantity: 0, quantityUnit: 'kg', scheduledDate: '', transportPrice: 0, description: '', destinationLat: 0, destinationLng: 0 };
    this.showCreateOfferModal = true;
  }

  closeCreateOffer(): void {
    this.showCreateOfferModal = false;
  }

  submitCreateOffer(): void {
    if (!this.offerForm.destination || !this.offerForm.scheduledDate) return;
    this.savingOffer = true;
    // Convert date-only string (YYYY-MM-DD) to LocalDateTime format expected by the backend
    const scheduledDateFormatted = this.offerForm.scheduledDate.includes('T')
      ? this.offerForm.scheduledDate
      : this.offerForm.scheduledDate + 'T00:00:00';
    const offerData: Partial<DeliveryRoute> = {
      destination: this.offerForm.destination,
      quantity: this.offerForm.quantity,
      quantityUnit: this.offerForm.quantityUnit,
      scheduledDate: scheduledDateFormatted,
      transportPrice: this.offerForm.transportPrice,
      description: this.offerForm.description,
      destinationLat: this.offerForm.destinationLat || undefined,
      destinationLng: this.offerForm.destinationLng || undefined,
      status: RouteStatus.PLANNED
    };
    this.deliveryService.createRoute(offerData as DeliveryRoute).subscribe({
      next: () => {
        this.savingOffer = false;
        this.showCreateOfferModal = false;
        this.loadMyRoutes();
        this.toastService.success('Offre publiée avec succès !');
      },
      error: () => {
        this.savingOffer = false;
        this.toastService.error('Erreur lors de la publication.');
      }
    });
  }

  deleteOffer(id: string): void {
    if (!confirm('Supprimer cette offre ?')) return;
    this.deliveryService.deleteRoute(id).subscribe({
      next: () => {
        this.myRoutes = this.myRoutes.filter(r => r.id !== id);
        this.toastService.success('Offre supprimée.');
      },
      error: () => this.toastService.error('Erreur lors de la suppression.')
    });
  }

  viewApplications(route: DeliveryRoute): void {
    this.selectedRouteForApplications = route;
    this.showApplicationsModal = true;
  }

  closeApplicationsModal(): void {
    this.showApplicationsModal = false;
    this.selectedRouteForApplications = null;
  }

  acceptApplication(route: DeliveryRoute, index: number): void {
    this.updatingAppIndex = index;
    this.deliveryService.updateLogisticsApplicationStatus(route.id!, index, 'ACCEPTED').subscribe({
      next: () => {
        if (route.applications) route.applications[index].status = 'ACCEPTED' as any;
        this.updatingAppIndex = null;
        this.toastService.success('Candidature acceptée !');
        this.loadMyRoutes();
      },
      error: () => { this.updatingAppIndex = null; }
    });
  }

  rejectApplication(route: DeliveryRoute, index: number): void {
    this.updatingAppIndex = index;
    this.deliveryService.updateLogisticsApplicationStatus(route.id!, index, 'REJECTED').subscribe({
      next: () => {
        if (route.applications) route.applications[index].status = 'REJECTED' as any;
        this.updatingAppIndex = null;
        this.loadMyRoutes();
      },
      error: () => { this.updatingAppIndex = null; }
    });
  }

  getOffersWithApplicants(): number {
    return this.myRoutes.filter(r => (r.applications?.length || 0) > 0).length;
  }

  getRouteStatusLabel(status: RouteStatus | undefined): string {
    const map: Record<string, string> = {
      PLANNED: 'En attente', IN_PROGRESS: 'En cours',
      COMPLETED: 'Terminée', CANCELLED: 'Annulée'
    };
    return map[status || ''] || 'Inconnu';
  }

  getRouteStatusClass(status: RouteStatus | undefined): string {
    const map: Record<string, string> = {
      PLANNED: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    return map[status || ''] || 'bg-gray-100 text-gray-700';
  }

  getRoutesCountByStatus(status: RouteStatus): number {
    return this.myRoutes.filter(r => r.status === status).length;
  }

  getActiveJobsCount(): number {
    return this.myJobOffers.filter(j => j.status === JobStatus.OPEN).length;
  }

  getTotalApplications(): number {
    return this.myJobOffers.reduce((sum, j) => sum + (j.applications?.length || 0), 0);
  }

  // ── Map location handlers ─────────────────────────────────────────────────
  onFarmLocationChanged(loc: MapLocation): void {
    this.farmForm.farmLat = loc.lat;
    this.farmForm.farmLng = loc.lng;
    this.farmForm.farmAddress = loc.address || '';
  }

  onOfferLocationChanged(loc: MapLocation): void {
    this.offerForm.destinationLat = loc.lat;
    this.offerForm.destinationLng = loc.lng;
    if (!this.offerForm.destination && loc.address) {
      this.offerForm.destination = loc.address.split(',').slice(0, 2).join(',').trim();
    }
  }

  getFarmLat(): number | undefined {
    return (this.currentUser?.farmerProfile as any)?.farmLat || undefined;
  }

  getFarmLng(): number | undefined {
    return (this.currentUser?.farmerProfile as any)?.farmLng || undefined;
  }

  getFarmAddress(): string {
    return (this.currentUser?.farmerProfile as any)?.farmAddress || '';
  }

  // ── Farm edit ────────────────────────────────────────────────────────────
  populateFarmForm(): void {
    const fp = this.currentUser?.farmerProfile;
    this.farmForm = {
      farmName: fp?.farmName || '',
      farmSize: fp?.farmSize || 0,
      specialties: fp?.specialties?.join(', ') || '',
      certifications: fp?.certifications || '',
      description: fp?.description || '',
      farmLat: (fp as any)?.farmLat || 0,
      farmLng: (fp as any)?.farmLng || 0,
      farmAddress: (fp as any)?.farmAddress || ''
    };
  }

  toggleFarmEdit(): void {
    this.editingFarm = !this.editingFarm;
    if (this.editingFarm) this.populateFarmForm();
  }

  saveFarmInfo(): void {
    this.savingFarm = true;
    const fp = this.currentUser?.farmerProfile;
    const updateData: any = {
      farmerProfile: {
        farmName: this.farmForm.farmName,
        farmSize: this.farmForm.farmSize,
        specialties: this.farmForm.specialties.split(',').map((s: string) => s.trim()).filter((s: string) => !!s),
        certifications: this.farmForm.certifications,
        description: this.farmForm.description,
        rating: fp?.rating || 0,
        totalReviews: fp?.totalReviews || 0,
        farmImage: fp?.farmImage || '',
        farmLat: this.farmForm.farmLat || null,
        farmLng: this.farmForm.farmLng || null,
        farmAddress: this.farmForm.farmAddress || ''
      }
    };
    this.authService.updateProfile(updateData).subscribe({
      next: () => {
        this.currentUser = this.authService.getCurrentUser();
        this.editingFarm = false;
        this.savingFarm = false;
        this.toastService.success('Informations de la ferme mises à jour !');
      },
      error: () => {
        this.savingFarm = false;
        this.toastService.error('Erreur lors de la sauvegarde.');
      }
    });
  }

  // ── Image uploads ─────────────────────────────────────────────────────────
  getBannerStyle(): SafeStyle {
    const img = this.currentUser?.farmerProfile?.farmImage;
    const url = img ? img : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200';
    return this.sanitizer.bypassSecurityTrustStyle(`url(${url})`);
  }

  triggerBannerUpload(): void {
    (document.getElementById('bannerInput') as HTMLInputElement)?.click();
  }

  triggerPhotoUpload(): void {
    (document.getElementById('photoInput') as HTMLInputElement)?.click();
  }

  onBannerChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.savingBanner = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const fp = this.currentUser?.farmerProfile;
      const updateData: any = {
        farmerProfile: { ...(fp as any), farmImage: base64 }
      };
      this.authService.updateProfile(updateData).subscribe({
        next: () => {
          this.currentUser = this.authService.getCurrentUser();
          this.savingBanner = false;
          this.toastService.success('Bannière mise à jour !');
        },
        error: (err: any) => {
          this.savingBanner = false;
          this.toastService.error(err?.error?.message || 'Erreur lors de la mise à jour de la bannière');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  onProfilePhotoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.savingPhoto = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      this.authService.updateProfile({ profileImage: base64 }).subscribe({
        next: () => {
          this.currentUser = this.authService.getCurrentUser();
          this.savingPhoto = false;
          this.toastService.success('Photo de profil mise à jour !');
        },
        error: () => { this.savingPhoto = false; }
      });
    };
    reader.readAsDataURL(file);
  }

  // ── Account ───────────────────────────────────────────────────────────────
  deactivateAccount(): void {
    if (!confirm('Êtes-vous sûr de vouloir désactiver votre compte ?')) return;
    this.authService.deactivateAccount().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.toastService.error('Erreur lors de la désactivation.')
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }

  // ── GPS Live Location Sharing ────────────────────────────────────────────
  isDelivering(order: Order): boolean {
    return order.status === 'SHIPPED' || order.status === 'PROCESSING';
  }

  startLocationShare(orderId: string): void {
    this.stopLocationShare();
    if (!navigator.geolocation) {
      this.toastService.error('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    this.sharingOrderId = orderId;
    const sendPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.orderService.updateOrderDriverLocation(orderId, pos.coords.latitude, pos.coords.longitude).subscribe();
        },
        () => { /* silently ignore GPS errors */ }
      );
    };
    sendPosition(); // send immediately
    this.locationShareTimer = setInterval(sendPosition, 15000);
    this.toastService.success('Partage de position démarré. Le client peut maintenant vous suivre en direct.');
  }

  stopLocationShare(): void {
    if (this.locationShareTimer) {
      clearInterval(this.locationShareTimer);
      this.locationShareTimer = null;
    }
    this.sharingOrderId = null;
  }

  ngOnDestroy(): void {
    this.stopLocationShare();
    if (this.orderDetailsMap) {
      this.orderDetailsMap.remove();
      this.orderDetailsMap = null;
    }
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    setTimeout(() => this.initOrderDetailsMap(order), 300);
  }

  closeOrderDetails(): void {
    this.selectedOrder = null;
    if (this.orderDetailsMap) {
      this.orderDetailsMap.remove();
      this.orderDetailsMap = null;
    }
  }

  initOrderDetailsMap(order: Order): void {
    const addr = order.deliveryAddress as any;
    if (!addr?.latitude || !addr?.longitude) return;
    const mapEl = document.getElementById('order-detail-map');
    if (!mapEl) return;
    if (this.orderDetailsMap) { this.orderDetailsMap.remove(); this.orderDetailsMap = null; }
    this.orderDetailsMap = L.map('order-detail-map').setView([addr.latitude, addr.longitude], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 OpenStreetMap',
      maxZoom: 19
    }).addTo(this.orderDetailsMap);
    const info = this.parseDeliveryNotes(order.deliveryNotes);
    L.marker([addr.latitude, addr.longitude])
      .addTo(this.orderDetailsMap)
      .bindPopup(`<b>${info.name || order.buyerName || 'Client'}</b><br>${addr.street || ''}, ${addr.city || ''}`)
      .openPopup();
  }

  parseDeliveryNotes(notes?: string): { name: string; phone: string; extra: string } {
    if (!notes) return { name: '', phone: '', extra: '' };
    const parts = notes.split(' | ');
    return { name: parts[0] || '', phone: parts[1] || '', extra: parts.slice(2).join(' | ') };
  }

  getNextStatus(status: OrderStatus): OrderStatus | null {
    const flow: Partial<Record<OrderStatus, OrderStatus>> = {
      [OrderStatus.CONFIRMED]: OrderStatus.PROCESSING,
    };
    return flow[status] ?? null;
  }

  getNextStatusLabel(status: OrderStatus): string {
    const labels: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.CONFIRMED]: 'Lancer la préparation',
    };
    const next = this.getNextStatus(status);
    return next ? (labels[status] ?? '') : '';
  }

  advanceOrderStatus(orderId: string, currentStatus: OrderStatus): void {
    const next = this.getNextStatus(currentStatus);
    if (!next) return;
    this.orderService.updateOrderStatus(orderId, next).subscribe({
      next: () => {
        const order = this.allOrders.find(o => o.id === orderId);
        if (order) order.status = next;
        if (this.selectedOrder?.id === orderId) this.selectedOrder.status = next;
        this.toastService.success('Statut mis à jour');
      },
      error: () => this.toastService.error('Erreur lors de la mise à jour')
    });
  }

  acceptOrder(orderId: string): void {
    this.orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED, 'Commande acceptée par l\'agriculteur').subscribe({
      next: () => {
        const order = this.allOrders.find(o => o.id === orderId);
        if (order) order.status = OrderStatus.CONFIRMED;
        if (this.selectedOrder?.id === orderId) this.selectedOrder.status = OrderStatus.CONFIRMED;
        this.toastService.success('Commande acceptée ! Le client peut procéder au paiement.');
      },
      error: () => this.toastService.error('Erreur lors de l\'acceptation')
    });
  }

  refuseOrder(orderId: string): void {
    if (!confirm('Refuser cette commande ? Le client sera informé de votre décision.')) return;
    this.orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED, 'Commande refusée par l\'agriculteur').subscribe({
      next: () => {
        const order = this.allOrders.find(o => o.id === orderId);
        if (order) order.status = OrderStatus.CANCELLED;
        if (this.selectedOrder?.id === orderId) this.selectedOrder.status = OrderStatus.CANCELLED;
        this.toastService.success('Commande refusée.');
      },
      error: () => this.toastService.error('Erreur lors du refus')
    });
  }

  submitDeparture(orderId: string): void {
    if (!this.departureForm.date || !this.departureForm.location) {
      this.toastService.error('Veuillez renseigner la date et le lieu de départ.');
      return;
    }
    this.departureSubmitting = true;
    this.orderService.setDeparture(orderId, {
      departureDate: this.departureForm.date,
      departureLocation: this.departureForm.location,
      transporterName: this.departureForm.transporterName || undefined
    }).subscribe({
      next: (res: any) => {
        const updated = res.data || res;
        const order = this.allOrders.find(o => o.id === orderId);
        if (order) {
          order.status = OrderStatus.SHIPPED;
          (order as any).departureDate = this.departureForm.date;
          (order as any).departureLocation = this.departureForm.location;
          (order as any).transporterName = this.departureForm.transporterName;
        }
        if (this.selectedOrder?.id === orderId) {
          this.selectedOrder.status = OrderStatus.SHIPPED;
          (this.selectedOrder as any).departureDate = this.departureForm.date;
          (this.selectedOrder as any).departureLocation = this.departureForm.location;
          (this.selectedOrder as any).transporterName = this.departureForm.transporterName;
        }
        this.departureForm = { date: '', location: '', transporterName: '' };
        this.departureSubmitting = false;
        this.toastService.success('Commande expédiée ! Le client peut maintenant suivre sa livraison.');
      },
      error: () => {
        this.departureSubmitting = false;
        this.toastService.error('Erreur lors de l\'expédition');
      }
    });
  }

  cancelDashboardOrder(orderId: string): void {
    if (!confirm('Annuler cette commande ?')) return;
    this.orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED).subscribe({
      next: () => {
        const order = this.allOrders.find(o => o.id === orderId);
        if (order) order.status = OrderStatus.CANCELLED;
        if (this.selectedOrder?.id === orderId) this.selectedOrder.status = OrderStatus.CANCELLED;
        this.toastService.success('Commande annulée');
      },
      error: () => this.toastService.error('Erreur lors de l\'annulation')
    });
  }

  formatOrderDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  formatOrderTime(date: string | Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getPendingOrdersCount(): number {
    return this.allOrders.filter(o => o.status === OrderStatus.PENDING).length;
  }
}
