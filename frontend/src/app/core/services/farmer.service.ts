import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class FarmerService {
  private usersApiUrl = `${environment.apiUrl}/users`;
  
  constructor(private http: HttpClient) {}
  
  getAllFarmers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.usersApiUrl}/by-role?role=FARMER`);
  }
  
  getFarmerById(id: string): Observable<User> {
    return this.http.get<User>(`${this.usersApiUrl}/${id}`);
  }
  
  getMyProfile(): Observable<User> {
    return this.http.get<User>(`${this.usersApiUrl}/me`);
  }
  
  updateProfile(user: User): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.usersApiUrl}/profile`, user);
  }
  
  getMyProducts(farmerId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/products/public/farmer/${farmerId}`);
  }
}
