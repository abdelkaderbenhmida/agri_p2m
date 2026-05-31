import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../core/services/delivery.service';
import { DeliveryRoute, RouteStatus, StopStatus } from '../../core/models/delivery.model';

@Component({
  selector: 'app-logistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logistics.component.html'
})
export class LogisticsComponent implements OnInit {
  routes: DeliveryRoute[] = [];
  filteredRoutes: DeliveryRoute[] = [];
  loading = true;
  saving = false;
  formError = '';
  selectedStatus: RouteStatus | null = null;
  currentView: 'list' | 'create' | 'edit' | 'view' = 'list';
  selectedRoute: DeliveryRoute | null = null;
  form: Partial<DeliveryRoute> = {};
  RouteStatus = RouteStatus;
  statuses = Object.values(RouteStatus);

  constructor(private deliveryService: DeliveryService) {}

  ngOnInit() { this.loadRoutes(); }

  loadRoutes() {
    this.loading = true;
    this.deliveryService.getAllRoutes().subscribe({
      next: (response) => {
        if (response.success) { this.routes = response.routes; this.applyFilter(); }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  backToList() {
    this.currentView = 'list'; this.selectedRoute = null; this.form = {}; this.formError = '';
  }

  showCreate() {
    this.form = { driverName: '', vehicleType: '', vehicleNumber: '', scheduledDate: '', totalDistance: 0, totalOrders: 0, stops: [], status: RouteStatus.PLANNED };
    this.formError = ''; this.currentView = 'create';
  }

  showEdit(route: DeliveryRoute) {
    this.selectedRoute = route;
    const d = route.scheduledDate ? new Date(route.scheduledDate) : new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const localDt = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    this.form = { driverName: route.driverName, vehicleType: route.vehicleType, vehicleNumber: route.vehicleNumber, scheduledDate: localDt, totalDistance: route.totalDistance, totalOrders: route.totalOrders };
    this.formError = ''; this.currentView = 'edit';
  }

  showView(route: DeliveryRoute) { this.selectedRoute = route; this.currentView = 'view'; }

  saveRoute() {
    if (!this.form.driverName || !this.form.vehicleType || !this.form.vehicleNumber || !this.form.scheduledDate) {
      this.formError = 'Veuillez remplir tous les champs obligatoires (*)'; return;
    }
    this.saving = true; this.formError = '';
    if (this.currentView === 'create') {
      this.deliveryService.createRoute(this.form as DeliveryRoute).subscribe({
        next: () => { this.saving = false; this.loadRoutes(); this.backToList(); },
        error: () => { this.formError = 'Erreur lors de la creation.'; this.saving = false; }
      });
    } else if (this.currentView === 'edit' && this.selectedRoute?.id) {
      this.deliveryService.updateRoute(this.selectedRoute.id, this.form).subscribe({
        next: () => { this.saving = false; this.loadRoutes(); this.backToList(); },
        error: () => { this.formError = 'Erreur lors de la mise a jour.'; this.saving = false; }
      });
    }
  }

  startRoute(id: string) {
    this.deliveryService.startRoute(id).subscribe({
      next: () => { this.loadRoutes(); if (this.currentView === 'view') { this.deliveryService.getRouteById(id).subscribe(r => { if (r.route) this.selectedRoute = r.route; }); } },
      error: () => alert('Erreur lors du demarrage')
    });
  }

  completeRoute(id: string) {
    if (!confirm('Marquer cette tournee comme terminee ?')) return;
    this.deliveryService.completeRoute(id).subscribe({
      next: () => { this.loadRoutes(); if (this.currentView === 'view') { this.deliveryService.getRouteById(id).subscribe(r => { if (r.route) this.selectedRoute = r.route; }); } },
      error: () => alert('Erreur lors de la finalisation')
    });
  }

  deleteRoute(id: string) {
    if (!confirm('Supprimer cette tournee ?')) return;
    this.deliveryService.deleteRoute(id).subscribe({ next: () => this.loadRoutes(), error: () => alert('Erreur') });
  }

  filterByStatus(status: RouteStatus | null) { this.selectedStatus = status; this.applyFilter(); }
  applyFilter() { this.filteredRoutes = this.selectedStatus ? this.routes.filter(r => r.status === this.selectedStatus) : [...this.routes]; }
  getCountByStatus(status: RouteStatus): number { return this.routes.filter(r => r.status === status).length; }
  getDeliveredCount(route: DeliveryRoute): number { return route.stops?.filter(s => s.status === StopStatus.DELIVERED).length || 0; }
  getProgressPercentage(route: DeliveryRoute): number { if (!route.stops?.length) return 0; return Math.round((this.getDeliveredCount(route) / route.stops.length) * 100); }

  getStatusBadgeClass(status: RouteStatus | undefined): string {
    const map: Record<string, string> = { PLANNED: 'bg-blue-100 text-blue-800', IN_PROGRESS: 'bg-yellow-100 text-yellow-800', COMPLETED: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-800' };
    return map[status || ''] || 'bg-gray-100 text-gray-800';
  }
  getStopBadgeClass(status: StopStatus): string {
    const map: Record<string, string> = { PENDING: 'bg-gray-200 text-gray-700', EN_ROUTE: 'bg-yellow-200 text-yellow-800', DELIVERED: 'bg-green-200 text-green-800', FAILED: 'bg-red-200 text-red-800', RESCHEDULED: 'bg-orange-200 text-orange-800' };
    return map[status] || 'bg-gray-200 text-gray-700';
  }
  getStopStatusBadgeClass(status: StopStatus): string {
    const map: Record<string, string> = { PENDING: 'bg-gray-100 text-gray-600', EN_ROUTE: 'bg-yellow-100 text-yellow-700', DELIVERED: 'bg-green-100 text-green-700', FAILED: 'bg-red-100 text-red-700', RESCHEDULED: 'bg-orange-100 text-orange-700' };
    return map[status] || 'bg-gray-100 text-gray-600';
  }
  formatStatus(status: RouteStatus | undefined): string {
    const map: Record<string, string> = { PLANNED: 'Planifiee', IN_PROGRESS: 'En cours', COMPLETED: 'Terminee', CANCELLED: 'Annulee' };
    return map[status || ''] || (status || '');
  }
  formatStopStatus(status: StopStatus): string {
    const map: Record<string, string> = { PENDING: 'En attente', EN_ROUTE: 'En route', DELIVERED: 'Livre', FAILED: 'Echoue', RESCHEDULED: 'Reprogramme' };
    return map[status] || status;
  }
  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}