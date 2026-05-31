import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  // Cache pour stocker les coordonnées de l'utilisateur
  private userLocation: Coordinates | null = null;

  // Coordonnées approximatives de villes tunisiennes pour simulation
  private locationMap: { [key: string]: Coordinates } = {
    'tunis': { latitude: 36.8065, longitude: 10.1815 },
    'ariana': { latitude: 36.8625, longitude: 10.1956 },
    'ben arous': { latitude: 36.7539, longitude: 10.2189 },
    'manouba': { latitude: 36.8081, longitude: 9.8633 },
    'nabeul': { latitude: 36.4516, longitude: 10.7361 },
    'cap bon': { latitude: 36.8462, longitude: 11.0358 },
    'zaghouan': { latitude: 36.4026, longitude: 10.1425 },
    'bizerte': { latitude: 37.2746, longitude: 9.8739 },
    'béja': { latitude: 36.7256, longitude: 9.1817 },
    'jendouba': { latitude: 36.5011, longitude: 8.7803 },
    'kef': { latitude: 36.1742, longitude: 8.7047 },
    'siliana': { latitude: 36.0853, longitude: 9.3706 },
    'sousse': { latitude: 35.8256, longitude: 10.6369 },
    'monastir': { latitude: 35.7772, longitude: 10.8264 },
    'mahdia': { latitude: 35.5047, longitude: 11.0622 },
    'sfax': { latitude: 34.7406, longitude: 10.7603 },
    'kairouan': { latitude: 35.6781, longitude: 10.0964 },
    'kasserine': { latitude: 35.1675, longitude: 8.8369 },
    'sidi bouzid': { latitude: 35.0381, longitude: 9.4858 },
    'gabès': { latitude: 33.8815, longitude: 10.0982 },
    'médenine': { latitude: 33.3549, longitude: 10.5053 },
    'tataouine': { latitude: 32.9297, longitude: 10.4517 },
    'gafsa': { latitude: 34.4250, longitude: 8.7842 },
    'tozeur': { latitude: 33.9197, longitude: 8.1339 },
    'kébili': { latitude: 33.7047, longitude: 8.9689 }
  };

  constructor() {}

  /**
   * Obtient la position actuelle de l'utilisateur via l'API Geolocation
   */
  getUserLocation(): Observable<Coordinates> {
    // Si on a déjà la position en cache, la retourner
    if (this.userLocation) {
      return of(this.userLocation);
    }

    // Vérifier si l'API Geolocation est disponible
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, using default location (Tunis)');
      this.userLocation = this.locationMap['tunis'];
      return of(this.userLocation);
    }

    // Obtenir la position actuelle
    return from(
      new Promise<Coordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords: Coordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            this.userLocation = coords;
            resolve(coords);
          },
          (error) => {
            console.warn('Error getting user location:', error);
            // En cas d'erreur, utiliser Tunis par défaut
            const defaultCoords = this.locationMap['tunis'];
            this.userLocation = defaultCoords;
            resolve(defaultCoords);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000 // 5 minutes
          }
        );
      })
    );
  }

  /**
   * Convertit un nom de ville/région en coordonnées GPS
   */
  getCoordinatesFromLocation(location: string): Coordinates | null {
    if (!location) return this.locationMap['tunis'];
    const locationLower = location.toLowerCase().trim();
    if (!locationLower) return this.locationMap['tunis'];
    // Chercher une correspondance exacte
    if (this.locationMap[locationLower]) {
      return this.locationMap[locationLower];
    }

    // Chercher une correspondance partielle
    for (const key in this.locationMap) {
      if (locationLower.includes(key) || key.includes(locationLower)) {
        return this.locationMap[key];
      }
    }

    // Par défaut, retourner Tunis
    return this.locationMap['tunis'];
  }

  /**
   * Calcule la distance entre deux points en utilisant la formule de Haversine
   * @param from Coordonnées du point de départ
   * @param to Coordonnées du point d'arrivée
   * @returns Distance en kilomètres
   */
  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(from.latitude)) *
        Math.cos(this.toRadians(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Arrondir à 1 décimale
  }

  /**
   * Convertit des degrés en radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calcule la distance entre l'utilisateur et une location donnée
   */
  calculateDistanceFromUser(targetLocation: string): Observable<number> {
    const targetCoords = this.getCoordinatesFromLocation(targetLocation);
    
    if (!targetCoords) {
      return of(999); // Distance très élevée si la location n'est pas trouvée
    }

    return this.getUserLocation().pipe(
      map(userCoords => this.calculateDistance(userCoords, targetCoords)),
      catchError(() => of(999))
    );
  }

  /**
   * Calcule les distances pour un tableau de locations
   */
  calculateDistancesFromUser(locations: string[]): Observable<Map<string, number>> {
    return this.getUserLocation().pipe(
      map(userCoords => {
        const distanceMap = new Map<string, number>();
        
        locations.forEach(location => {
          const targetCoords = this.getCoordinatesFromLocation(location);
          if (targetCoords) {
            const distance = this.calculateDistance(userCoords, targetCoords);
            distanceMap.set(location, distance);
          } else {
            distanceMap.set(location, 999);
          }
        });

        return distanceMap;
      }),
      catchError(() => {
        // En cas d'erreur, retourner des distances par défaut
        const distanceMap = new Map<string, number>();
        locations.forEach(location => distanceMap.set(location, 999));
        return of(distanceMap);
      })
    );
  }

  /**
   * Réinitialise le cache de la position utilisateur
   */
  clearCache(): void {
    this.userLocation = null;
  }
}
