import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductRequest, ProductCategory } from '../models/product.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  
  constructor(private http: HttpClient) {}
  
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/public/all`);
  }
  
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/public/${id}`);
  }
  
  getProductsByCategory(category: ProductCategory): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/public/category/${category}`);
  }
  
  getProductsByFarmer(farmerId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/public/farmer/${farmerId}`);
  }
  
  searchProducts(keyword: string): Observable<Product[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<Product[]>(`${this.apiUrl}/public/search`, { params });
  }
  
  createProduct(product: ProductRequest): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, product);
  }
  
  updateProduct(id: string, product: ProductRequest): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, product);
  }
  
  deleteProduct(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }
  
  addReview(productId: string, rating: number, comment: string): Observable<ApiResponse<Product>> {
    const params = new HttpParams()
      .set('rating', rating.toString())
      .set('comment', comment);
    return this.http.post<ApiResponse<Product>>(`${this.apiUrl}/${productId}/review`, null, { params });
  }
}
