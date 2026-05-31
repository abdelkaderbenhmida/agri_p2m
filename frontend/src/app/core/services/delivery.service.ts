import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeliveryRoute, LogisticsApplication } from '../models/delivery.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = `${environment.apiUrl}/delivery`;

  constructor(private http: HttpClient) {}

  // Get all delivery routes
  getAllRoutes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/routes`);
  }

  // Get route by ID
  getRouteById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/routes/${id}`);
  }

  // Get routes by status
  getRoutesByStatus(status: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/routes/status/${status}`);
  }

  // Get my routes as driver
  getMyRoutes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-routes`);
  }

  // Get my logistics offers as farmer
  getMyFarmerOffers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/farmer-offers`);
  }

  // Create new delivery route / logistics offer
  createRoute(route: DeliveryRoute): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/routes`, route);
  }

  // Update delivery route
  updateRoute(id: string, route: Partial<DeliveryRoute>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/routes/${id}`, route);
  }

  // Start route
  startRoute(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/routes/${id}/start`, {});
  }

  // Complete route
  completeRoute(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/routes/${id}/complete`, {});
  }

  // Update delivery stop status
  updateStopStatus(routeId: string, stopIndex: number, updates: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/routes/${routeId}/stops/${stopIndex}`, updates);
  }

  // Delete route
  deleteRoute(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/routes/${id}`);
  }

  // Update driver GPS location
  updateDriverLocation(routeId: string, lat: number, lng: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/routes/${routeId}/driver-location`, { lat, lng });
  }

  // Apply to be driver for a route (buyer)
  applyToRoute(routeId: string, application: Partial<LogisticsApplication>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/routes/${routeId}/apply`, application);
  }

  // Get my logistics applications (buyer)
  getMyLogisticsApplications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/applications/my`);
  }

  // Update logistics application status (farmer)
  updateLogisticsApplicationStatus(routeId: string, appIndex: number, status: string, notes?: string): Observable<any> {
    const body: any = { status };
    if (notes) body.notes = notes;
    return this.http.put<any>(`${this.apiUrl}/routes/${routeId}/applications/${appIndex}`, body);
  }
}
