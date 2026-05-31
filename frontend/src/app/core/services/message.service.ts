import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, interval } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Message, Conversation } from '../models/message.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = `${environment.apiUrl}/messages`;
  private usersApiUrl = `${environment.apiUrl}/users`;

  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Poll for new messages every 30 seconds
    interval(30000).subscribe(() => {
      this.refreshUnreadCount();
    });
  }

  /**
   * Get all conversations for the current user
   */
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`).pipe(
      tap(conversations => {
        this.conversationsSubject.next(conversations);
        this.calculateUnreadCount(conversations);
      }),
      catchError(error => {
        console.error('Error loading conversations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get a specific conversation by ID
   */
  getConversation(conversationId: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.apiUrl}/conversations/${conversationId}`).pipe(
      catchError(error => {
        console.error('Error loading conversation:', error);
        throw error;
      })
    );
  }

  /**
   * Get messages from a conversation
   */
  getMessages(conversationId: string): Observable<Message[]> {
    return this.getConversation(conversationId).pipe(
      map(conversation => conversation.messages || []),
      tap(() => {
        // Mark conversation as read
        this.markAsRead(conversationId).subscribe();
      })
    );
  }

  /**
   * Send a message in a conversation
   */
  sendMessage(conversationId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send`, {
      conversationId,
      content
    }).pipe(
      tap(() => {
        // Refresh conversations after sending
        this.getConversations().subscribe();
      }),
      catchError(error => {
        console.error('Error sending message:', error);
        throw error;
      })
    );
  }

  /**
   * Create a new conversation
   */
  createConversation(
    customerId: string,
    customerName: string,
    farmerId: string,
    farmerName: string,
    productId?: string,
    productName?: string
  ): Observable<Conversation> {
    return this.http.post<any>(`${this.apiUrl}/conversations`, {
      customerId,
      customerName,
      farmerId,
      farmerName
    }).pipe(
      map(response => response.data),
      tap(conversation => {
        // Add to local conversations
        const current = this.conversationsSubject.getValue();
        this.conversationsSubject.next([conversation, ...current]);
      }),
      catchError(error => {
        console.error('Error creating conversation:', error);
        throw error;
      })
    );
  }

  /**
   * Mark conversation as read
   */
  markAsRead(conversationId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/conversations/${conversationId}/read`, {}).pipe(
      tap(() => {
        // Refresh conversations to update unread count
        this.getConversations().subscribe();
      }),
      catchError(error => {
        console.error('Error marking as read:', error);
        return of(null);
      })
    );
  }

  /**
   * Get unread message count
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/unread-count`).pipe(
      map(response => response.data || 0),
      tap(count => {
        this.unreadCountSubject.next(count);
      }),
      catchError(error => {
        console.error('Error getting unread count:', error);
        return of(0);
      })
    );
  }

  /**
   * Refresh unread count
   */
  private refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }

  /**
   * Calculate unread count from conversations
   */
  private calculateUnreadCount(conversations: Conversation[]): void {
    let count = 0;
    const userJson = localStorage.getItem('user');
    const currentUserId = userJson ? JSON.parse(userJson).id : null;
    
    conversations.forEach(conv => {
      conv.messages?.forEach(msg => {
        if (msg.senderId !== currentUserId && !msg.isRead) {
          count++;
        }
      });
    });

    this.unreadCountSubject.next(count);
  }

  /**
   * Get all users by role for starting new conversations
   */
  getUsersByRole(role: 'FARMER' | 'CUSTOMER'): Observable<any[]> {
    return this.http.get<any[]>(`${this.usersApiUrl}/by-role?role=${role}`).pipe(
      catchError(() => of([]))
    );
  }
}
