import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Message, Conversation } from '../../core/models/message.model';
import { User, UserRole } from '../../core/models/user.model';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SkeletonComponent],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css'
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedConversation: Conversation | null = null;
  currentUser: User | null = null;
  newMessage = '';
  loading = true;
  sendingMessage = false;
  needsScroll = false;

  // New conversation modal
  showNewConvModal = false;
  userSearchQuery = '';
  userSearchResults: any[] = [];
  loadingUsers = false;
  startingConv = false;
  isConnected = false;
  searchQuery = '';

  private wsSub: Subscription | null = null;
  private pollTimer: any = null;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private wsService: WebSocketService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadConversations();
      this.pollTimer = setInterval(() => this.refreshConversations(), 15000);
    }
  }

  ngOnDestroy() {
    this.wsService.disconnect();
    if (this.wsSub) this.wsSub.unsubscribe();
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  ngAfterViewChecked() {
    if (this.needsScroll) {
      this.scrollToBottom();
      this.needsScroll = false;
    }
  }

  loadConversations() {
    this.loading = true;
    this.messageService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = this.sortConversations(conversations);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private refreshConversations() {
    this.messageService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = this.sortConversations(conversations);
        if (this.selectedConversation) {
          const updated = this.conversations.find(c => c.id === this.selectedConversation!.id);
          if (updated) this.selectedConversation = updated;
        }
      }
    });
  }

  private sortConversations(convs: Conversation[]): Conversation[] {
    return [...convs].sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
  }

  get filteredConversations(): Conversation[] {
    if (!this.searchQuery.trim()) return this.conversations;
    const q = this.searchQuery.toLowerCase();
    return this.conversations.filter(c =>
      c.farmerName?.toLowerCase().includes(q) ||
      c.customerName?.toLowerCase().includes(q)
    );
  }

  selectConversation(conversation: Conversation) {
    if (this.selectedConversation?.id === conversation.id) return;
    this.selectedConversation = conversation;
    this.messages = [];
    this.loadMessages(conversation.id);
    this.connectWebSocket(conversation.id);
    this.messageService.markAsRead(conversation.id).subscribe();
  }

  private connectWebSocket(conversationId: string) {
    if (this.wsSub) this.wsSub.unsubscribe();
    this.wsService.disconnect();
    this.isConnected = false;

    const token = this.authService.getToken() || '';
    this.wsSub = this.wsService.connect(conversationId, token).subscribe({
      next: (msg: any) => {
        const isDuplicate = this.messages.some(m =>
          m.senderId === msg.senderId &&
          m.content === msg.content &&
          Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 3000
        );
        if (!isDuplicate) {
          this.messages.push({
            senderId: msg.senderId,
            senderName: msg.senderName,
            content: msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
            isRead: false
          });
          this.needsScroll = true;
          this.refreshConversations();
        }
      },
      error: () => { this.isConnected = false; }
    });
    setTimeout(() => { this.isConnected = true; }, 1000);
  }

  loadMessages(conversationId: string) {
    this.messageService.getMessages(conversationId).subscribe({
      next: (msgs) => {
        this.messages = [...msgs].sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        this.needsScroll = true;
      }
    });
  }

  sendMessage() {
    const content = this.newMessage.trim();
    if (!content || !this.selectedConversation || !this.currentUser || this.sendingMessage) return;

    this.sendingMessage = true;
    const optimistic: Message = {
      senderId: this.currentUser.id!,
      senderName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
      content,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    this.messages.push(optimistic);
    this.newMessage = '';
    this.needsScroll = true;

    this.messageService.sendMessage(this.selectedConversation.id, content).subscribe({
      next: () => {
        this.sendingMessage = false;
        this.loadMessages(this.selectedConversation!.id);
        this.refreshConversations();
      },
      error: () => {
        this.sendingMessage = false;
        this.messages = this.messages.filter(m => m !== optimistic);
        this.newMessage = content;
      }
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom() {
    if (this.messagesContainer?.nativeElement) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }

  isMyMessage(message: Message): boolean {
    return message.senderId === this.currentUser?.id;
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "A l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  getOtherPersonName(): string {
    if (!this.selectedConversation || !this.currentUser) return '';
    return this.currentUser.role === UserRole.CUSTOMER
      ? this.selectedConversation.farmerName
      : this.selectedConversation.customerName;
  }

  getConvName(conv: Conversation): string {
    if (!this.currentUser) return '';
    return this.currentUser.role === UserRole.CUSTOMER ? conv.farmerName : conv.customerName;
  }

  getLastMessage(conv: Conversation): string {
    if (!conv.messages?.length) return 'Demarrez la conversation...';
    return conv.messages[conv.messages.length - 1].content || '';
  }

  getUnreadCount(conv: Conversation): number {
    if (!conv.messages || !this.currentUser) return 0;
    return conv.messages.filter(m => m.senderId !== this.currentUser!.id && !m.isRead).length;
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const a = new Date(this.messages[index - 1].timestamp);
    const b = new Date(this.messages[index].timestamp);
    return a.toDateString() !== b.toDateString();
  }

  getDateLabel(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  // ── New conversation modal ────────────────────────────────────────────────

  openNewConvModal() {
    this.showNewConvModal = true;
    this.userSearchQuery = '';
    this.userSearchResults = [];
    this.loadUsers();
  }

  closeNewConvModal() {
    this.showNewConvModal = false;
    this.userSearchQuery = '';
    this.userSearchResults = [];
  }

  loadUsers() {
    if (!this.currentUser) return;
    this.loadingUsers = true;
    // Customer sees farmers, Farmer sees customers
    const role = this.currentUser.role === UserRole.CUSTOMER ? 'FARMER' : 'CUSTOMER';
    this.messageService.getUsersByRole(role).subscribe({
      next: (users) => {
        this.userSearchResults = users.filter(u => u.id !== this.currentUser!.id);
        this.loadingUsers = false;
      },
      error: () => { this.loadingUsers = false; }
    });
  }

  get filteredUsers(): any[] {
    if (!this.userSearchQuery.trim()) return this.userSearchResults;
    const q = this.userSearchQuery.toLowerCase();
    return this.userSearchResults.filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.farmerProfile?.farmName?.toLowerCase().includes(q)
    );
  }

  startConversation(user: any) {
    if (!this.currentUser || this.startingConv) return;
    this.startingConv = true;

    const isCurrentCustomer = this.currentUser.role === UserRole.CUSTOMER;
    const customerId    = isCurrentCustomer ? this.currentUser.id! : user.id;
    const customerName  = isCurrentCustomer
      ? `${this.currentUser.firstName} ${this.currentUser.lastName}`
      : `${user.firstName} ${user.lastName}`;
    const farmerId   = isCurrentCustomer ? user.id : this.currentUser.id!;
    const farmerName = isCurrentCustomer
      ? `${user.firstName} ${user.lastName}`
      : `${this.currentUser.firstName} ${this.currentUser.lastName}`;

    this.messageService.createConversation(customerId, customerName, farmerId, farmerName)
      .subscribe({
        next: (conv) => {
          this.startingConv = false;
          this.closeNewConvModal();
          this.loadConversations();
          if (conv) this.selectConversation(conv);
        },
        error: () => { this.startingConv = false; }
      });
  }
}
