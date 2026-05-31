import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../core/services/delivery.service';
import { AuthService } from '../../core/services/auth.service';
import { DeliveryRoute, RouteStatus, LogisticsApplication, LogisticsAppStatus } from '../../core/models/delivery.model';
import { MapViewComponent } from '../../shared/components/map-view/map-view.component';

@Component({
  selector: 'app-buyer-logistics',
  standalone: true,
  imports: [CommonModule, FormsModule, MapViewComponent],
  templateUrl: './buyer-logistics.component.html'
})
export class BuyerLogisticsComponent implements OnInit, OnDestroy {
  routes: DeliveryRoute[] = [];
  filteredRoutes: DeliveryRoute[] = [];
  loading = true;
  currentUser: any;

  // Search
  searchText = '';

  // Detail view
  selectedRoute: DeliveryRoute | null = null;
  showDetail = false;

  // Apply modal
  showApplyModal = false;
  applying = false;
  applyError = '';
  applySuccess = '';
  applicationForm: Partial<LogisticsApplication> = {};

  // My applications
  showMyApplications = false;
  myApplications: Array<{ route: DeliveryRoute; application: LogisticsApplication; applicationIndex: number }> = [];
  loadingMyApps = false;

  RouteStatus = RouteStatus;
  LogisticsAppStatus = LogisticsAppStatus;

  vehicleTypes = ['Camionnette', 'Camion', 'Fourgon', 'Moto', 'Voiture'];

  // Live tracking (driver shares position)
  trackingActive = false;
  trackingRouteId: string | null = null;
  trackingTimer: any = null;
  driverCurrentLat: number | null = null;
  driverCurrentLng: number | null = null;
  sharingLocation = false;
  locationShareTimer: any = null;

  constructor(private deliveryService: DeliveryService, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadRoutes();
  }

  loadRoutes() {
    this.loading = true;
    this.deliveryService.getRoutesByStatus('PLANNED').subscribe({
      next: (res) => {
        this.routes = res.routes || [];
        this.applySearch();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applySearch() {
    let result = [...this.routes];
    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      result = result.filter(r =>
        r.driverName?.toLowerCase().includes(q) ||
        r.vehicleType?.toLowerCase().includes(q) ||
        r.destination?.toLowerCase().includes(q) ||
        r.stops?.some(s => s.address?.toLowerCase().includes(q))
      );
    }
    this.filteredRoutes = result;
  }

  openDetail(route: DeliveryRoute) {
    this.selectedRoute = route;
    this.showDetail = true;
    this.showMyApplications = false;
  }

  closeDetail() {
    this.showDetail = false;
    this.selectedRoute = null;
  }

  openApply(route: DeliveryRoute) {
    if (!this.currentUser) {
      alert('Vous devez être connecté pour postuler.');
      return;
    }
    this.selectedRoute = route;
    this.applicationForm = { applicantPhone: '', message: '', vehicleType: '', licenseNumber: '' };
    this.applyError = '';
    this.applySuccess = '';
    this.showApplyModal = true;
    this.showDetail = false;
  }

  closeModal() {
    this.showApplyModal = false;
  }

  submitApplication() {
    if (!this.applicationForm.message?.trim()) {
      this.applyError = 'Veuillez rédiger un message de motivation.';
      return;
    }
    this.applying = true;
    this.applyError = '';
    this.deliveryService.applyToRoute(this.selectedRoute!.id!, this.applicationForm).subscribe({
      next: (res) => {
        this.applying = false;
        if (res.success) {
          this.applySuccess = 'Candidature envoyée avec succès !';
          this.loadRoutes();
          setTimeout(() => { this.closeModal(); this.applySuccess = ''; }, 2000);
        } else {
          this.applyError = res.message || 'Erreur lors de l\'envoi.';
        }
      },
      error: (err) => {
        this.applying = false;
        this.applyError = err.error?.message || 'Erreur lors de l\'envoi.';
      }
    });
  }

  loadMyApplications() {
    if (!this.currentUser) { alert('Connectez-vous pour voir vos candidatures.'); return; }
    this.showMyApplications = true;
    this.showDetail = false;
    this.loadingMyApps = true;
    this.myApplications = [];

    this.deliveryService.getMyLogisticsApplications().subscribe({
      next: (res) => {
        if (res.success && res.applications) {
          this.myApplications = res.applications.map((item: any) => ({
            route: item.route,
            application: item.application,
            applicationIndex: item.applicationIndex
          }));
        }
        this.loadingMyApps = false;
      },
      error: () => { this.loadingMyApps = false; }
    });
  }

  getAppStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      REVIEWED: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }

  formatAppStatus(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente', REVIEWED: 'Examinée', ACCEPTED: 'Acceptée', REJECTED: 'Refusée'
    };
    return map[status] || status;
  }

  alreadyApplied(route: DeliveryRoute): boolean {
    if (!this.currentUser || !route.applications) return false;
    return route.applications.some(
      a => a.applicantId === this.currentUser.id || a.applicantEmail === this.currentUser.email
    );
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getUniqueRegions(route: DeliveryRoute): string {
    if (route.destination) return route.destination;
    if (!route.stops?.length) return 'Non spécifié';
    const addresses = route.stops.map(s => s.address?.split(',').pop()?.trim() || s.address).filter(Boolean);
    return [...new Set(addresses)].slice(0, 2).join(', ');
  }

  // ── Live tracking (driver shares GPS position) ────────────────────────────

  startSharingLocation(routeId: string): void {
    if (!navigator.geolocation) { alert('Géolocalisation non supportée.'); return; }
    this.sharingLocation = true;
    this.trackingRouteId = routeId;
    const sendPos = () => {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        this.deliveryService.updateDriverLocation(routeId, latitude, longitude).subscribe();
      });
    };
    sendPos();
    this.locationShareTimer = setInterval(sendPos, 15000);
  }

  stopSharingLocation(): void {
    this.sharingLocation = false;
    this.trackingRouteId = null;
    if (this.locationShareTimer) { clearInterval(this.locationShareTimer); this.locationShareTimer = null; }
  }

  startTrackingRoute(routeId: string): void {
    this.trackingActive = true;
    this.trackingRouteId = routeId;
    const poll = () => {
      this.deliveryService.getRouteById(routeId).subscribe({
        next: (res: any) => {
          const r: DeliveryRoute = res.route || res;
          this.driverCurrentLat = r.driverCurrentLat || null;
          this.driverCurrentLng = r.driverCurrentLng || null;
          // update the selected route's driver coordinates too
          if (this.selectedRoute?.id === routeId) {
            (this.selectedRoute as any).driverCurrentLat = r.driverCurrentLat;
            (this.selectedRoute as any).driverCurrentLng = r.driverCurrentLng;
          }
        }
      });
    };
    poll();
    this.trackingTimer = setInterval(poll, 10000);
  }

  stopTrackingRoute(): void {
    this.trackingActive = false;
    this.trackingRouteId = null;
    this.driverCurrentLat = null;
    this.driverCurrentLng = null;
    if (this.trackingTimer) { clearInterval(this.trackingTimer); this.trackingTimer = null; }
  }

  ngOnDestroy(): void {
    this.stopSharingLocation();
    this.stopTrackingRoute();
  }
}
