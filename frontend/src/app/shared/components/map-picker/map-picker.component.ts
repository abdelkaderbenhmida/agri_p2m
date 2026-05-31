import {
  Component, Input, Output, EventEmitter,
  AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild, PLATFORM_ID, Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-2">
      <!-- Search box -->
      <div class="flex gap-2">
        <input [(ngModel)]="searchQuery" (keydown.enter)="searchAddress()"
               type="text" placeholder="Rechercher une adresse..."
               class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none">
        <button (click)="searchAddress()" type="button"
                class="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
          🔍
        </button>
        <button (click)="useMyLocation()" type="button" title="Ma position"
                class="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          📍
        </button>
      </div>
      <!-- Map container -->
      <div #mapContainer [style.height]="height" class="rounded-lg border border-gray-300 overflow-hidden bg-gray-50"></div>
      <!-- Coordinates display -->
      <div *ngIf="location" class="text-xs text-gray-500 flex items-center gap-1">
        <span>📍</span>
        <span>{{ location.lat | number:'1.4-4' }}, {{ location.lng | number:'1.4-4' }}</span>
        <span *ngIf="location.address" class="text-gray-700 font-medium">— {{ location.address }}</span>
      </div>
      <p *ngIf="!location" class="text-xs text-gray-400">Cliquez sur la carte pour définir la position</p>
    </div>
  `
})
export class MapPickerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @Input() initialLat?: number;
  @Input() initialLng?: number;
  @Input() height = '280px';
  @Output() locationChanged = new EventEmitter<MapLocation>();

  location: MapLocation | null = null;
  searchQuery = '';

  private map: any = null;
  private marker: any = null;
  private L: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['initialLat'] || changes['initialLng']) && this.map && this.initialLat && this.initialLng) {
      this.setMarker(this.initialLat, this.initialLng);
      this.map.setView([this.initialLat, this.initialLng], 13);
    }
  }

  private async initMap() {
    const leafletModule: any = await import('leaflet');
    this.L = leafletModule?.default ?? leafletModule;
    // Fix default marker icon paths
    const L = this.L;
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const defaultLat = this.initialLat || 33.8869;
    const defaultLng = this.initialLng || 9.5375;
    const defaultZoom = (this.initialLat && this.initialLng) ? 13 : 6;

    this.map = L.map(this.mapContainer.nativeElement).setView([defaultLat, defaultLng], defaultZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    if (this.initialLat && this.initialLng) {
      this.setMarker(this.initialLat, this.initialLng);
    }

    this.map.on('click', (e: any) => {
      this.setMarker(e.latlng.lat, e.latlng.lng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  setMarker(lat: number, lng: number, address?: string) {
    const L = this.L;
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    this.marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.reverseGeocode(pos.lat, pos.lng);
    });

    this.location = { lat, lng, address };
    this.locationChanged.emit(this.location);
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await res.json();
      const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      this.location = { lat, lng, address };
      this.locationChanged.emit(this.location);
    } catch {
      this.location = { lat, lng };
      this.locationChanged.emit(this.location);
    }
  }

  async searchAddress() {
    if (!this.searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.searchQuery)}&format=json&limit=1&countrycodes=tn`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latN = parseFloat(lat);
        const lngN = parseFloat(lon);
        this.map.setView([latN, lngN], 14);
        this.setMarker(latN, lngN, display_name);
      }
    } catch { /* ignore */ }
  }

  useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      this.map.setView([latitude, longitude], 15);
      this.setMarker(latitude, longitude);
      this.reverseGeocode(latitude, longitude);
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
