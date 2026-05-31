import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentMethod } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  // Get user's payment methods
  getPaymentMethods(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/methods`);
  }

  // Add payment method
  addPaymentMethod(paymentMethod: PaymentMethod): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/methods`, paymentMethod);
  }

  // Set default payment method
  setDefaultPaymentMethod(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/methods/${id}/set-default`, {});
  }

  // Delete payment method
  deletePaymentMethod(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/methods/${id}`);
  }

  // Create payment intent for Stripe
  createPaymentIntent(amount: number, currency: string = 'usd'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-intent`, { amount, currency });
  }

  // Get payment configuration (Stripe keys, etc.)
  getPaymentConfig(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/config`);
  }
}
