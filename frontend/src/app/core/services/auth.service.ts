import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, SignupRequest, AuthResponse, User, UpdateProfileRequest, ChangePasswordRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private normalizeEmail(email: string): string {
    return (email || '').replace(/^mailto:/i, '').trim().toLowerCase();
  }
  
  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }
  
  login(credentials: LoginRequest): Observable<AuthResponse> {
    const payload: LoginRequest = {
      ...credentials,
      email: this.normalizeEmail(credentials.email)
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  loginWithGoogle(idToken: string, role: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { token: idToken, role }).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }
  
  signup(data: SignupRequest): Observable<AuthResponse> {
    const payload: SignupRequest = {
      ...data,
      email: this.normalizeEmail(data.email)
    };

    // Ne pas auto-connecter après inscription — l'utilisateur doit se connecter manuellement
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, payload);
  }
  
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }
  
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
  
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    const user: User = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      phone: response.phone || '',
      role: response.role as any,
      address: response.address,
      profileImage: response.profileImage,
      isVerified: response.isVerified || false,
      isActive: response.isActive || true,
      farmerProfile: response.farmerProfile,
      favoriteProducts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
  
  private loadCurrentUser(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      this.currentUserSubject.next(JSON.parse(userJson));
    }
  }

  updateProfile(data: UpdateProfileRequest): Observable<User> {
    return this.http.put<any>(`${environment.apiUrl}/users/profile`, data).pipe(
      map(response => (response && response.data ? response.data : response) as User),
      tap(user => {
        const updatedUser = {
          ...this.currentUserSubject.value,
          ...user
        } as User;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/change-password`, data);
  }

  deactivateAccount(): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/users/profile`, { isActive: false }).pipe(
      tap(() => this.logout())
    );
  }
}
