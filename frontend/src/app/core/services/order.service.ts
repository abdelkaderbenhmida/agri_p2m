import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, CreateOrderRequest, OrderStatus } from '../models/order.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;
  
  constructor(private http: HttpClient) {}
  
  createOrder(orderRequest: CreateOrderRequest): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(this.apiUrl, orderRequest);
  }
  
  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }
  
  getBuyerOrders(buyerId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/buyer/${buyerId}`);
  }
  
  getFarmerOrders(farmerId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/farmer/${farmerId}`);
  }
  
  getMyFarmerOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/farmer/my-orders`);
  }
  
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }
  
  updateOrderStatus(id: string, status: OrderStatus, description?: string): Observable<ApiResponse<Order>> {
    let params = new HttpParams().set('status', status);
    params = params.set('description', description || 'Mise à jour du statut');
    return this.http.put<ApiResponse<Order>>(`${this.apiUrl}/${id}/status`, null, { params });
  }
  
  cancelOrder(id: string): Observable<ApiResponse<Order>> {
    return this.http.delete<ApiResponse<Order>>(`${this.apiUrl}/${id}`);
  }

  updateOrderDriverLocation(orderId: string, lat: number, lng: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}/driver-location`, { lat, lng });
  }

  confirmReceipt(orderId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}/confirm-receipt`, {});
  }

  rateOrder(orderId: string, rating: number, reviewText: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}/rate`, { rating, reviewText });
  }

  setDeparture(orderId: string, data: { departureDate: string; departureLocation: string; transporterName?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}/departure`, data);
  }

  initiateKonnectPayment(orderId: string): Observable<{ payUrl: string; paymentRef: string }> {
    return this.http.post<{ payUrl: string; paymentRef: string }>(
      `${environment.apiUrl}/payments/konnect/initiate/${orderId}`, {}
    );
  }

  verifyKonnectPayment(ref: string, orderId: string): Observable<{ success: boolean }> {
    return this.http.get<{ success: boolean }>(
      `${environment.apiUrl}/payments/konnect/verify`,
      { params: { ref, orderId } }
    );
  }
}
