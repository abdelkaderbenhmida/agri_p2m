import {
  Component, Input, AfterViewInit, OnDestroy, OnChanges,
  SimpleChanges, ElementRef, ViewChild, PLATFORM_ID, Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div #mapContainer [style.height]="height" class="rounded-lg border border-gray-200 overflow-hidden bg-gray-50"></div>
      <p *ngIf="lat && lng" class="text-xs text-gray-400 mt-1">
        📍 {{ lat | number:'1.4-4' }}, {{ lng | number:'1.4-4' }}
        <span *ngIf="label"> — {{ label }}</span>
      </p>
    </div>
  `
})
export class MapViewComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  @Input() lat?: number;
  @Input() lng?: number;
  @Input() label?: string;
  @Input() height = '200px';
  /** For tracking: pass driverLat/driverLng to show driver as separate marker */
  @Input() driverLat?: number;
  @Input() driverLng?: number;
  /** If true, auto-refreshes driver position every refreshInterval ms */
  @Input() liveTracking = false;
  @Input() refreshInterval = 10000;

  private map: any = null;
  private destinationMarker: any = null;
  private driverMarker: any = null;
  private L: any = null;
  private refreshTimer: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.map || !this.L) return;
    if (changes['driverLat'] || changes['driverLng']) {
      this.updateDriverMarker();
    }
    if ((changes['lat'] || changes['lng']) && this.lat && this.lng) {
      this.updateDestinationMarker();
    }
  }

  private async initMap() {
    if (!this.lat || !this.lng) return;
    const leafletModule: any = await import('leaflet');
    this.L = leafletModule?.default ?? leafletModule;
    const L = this.L;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    this.map = L.map(this.mapContainer.nativeElement, { zoomControl: true, dragging: true }).setView([this.lat, this.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.updateDestinationMarker();
    if (this.driverLat && this.driverLng) {
      this.updateDriverMarker();
    }
  }

  private updateDestinationMarker() {
    if (!this.map || !this.lat || !this.lng) return;
    const L = this.L;
    if (this.destinationMarker) this.map.removeLayer(this.destinationMarker);

    const icon = L.divIcon({
      html: '<div style="background:#16a34a;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
      iconSize: [28, 28], iconAnchor: [14, 28], className: ''
    });
    this.destinationMarker = L.marker([this.lat, this.lng], { icon })
      .addTo(this.map)
      .bindPopup(this.label || 'Destination');
    this.map.setView([this.lat, this.lng], 13);
  }

  private updateDriverMarker() {
    if (!this.map || !this.driverLat || !this.driverLng) return;
    const L = this.L;
    if (this.driverMarker) this.map.removeLayer(this.driverMarker);

    const truckIcon = L.divIcon({
      html: '<div style="font-size:28px;line-height:1">🚚</div>',
      iconSize: [32, 32], iconAnchor: [16, 16], className: ''
    });
    this.driverMarker = L.marker([this.driverLat, this.driverLng], { icon: truckIcon })
      .addTo(this.map)
      .bindPopup('Livreur en route');

    // Fit bounds to show both markers
    if (this.lat && this.lng) {
      const L2 = this.L;
      const bounds = L2.latLngBounds(
        [this.lat, this.lng],
        [this.driverLat, this.driverLng]
      );
      this.map.fitBounds(bounds, { padding: [30, 30] });
    }
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
