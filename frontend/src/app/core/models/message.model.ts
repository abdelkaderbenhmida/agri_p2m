export interface Message {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date | string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  farmerId: string;
  farmerName: string;
  messages: Message[];
  lastMessageAt: Date | string;
  createdAt: Date | string;
}

// Legacy interface for backward compatibility
export interface MessageLegacy {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'BUYER' | 'FARMER';
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface ConversationLegacy {
  id: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  productId?: string;
  productName?: string;
}
