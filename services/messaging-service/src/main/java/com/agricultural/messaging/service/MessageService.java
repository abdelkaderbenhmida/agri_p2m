package com.agricultural.messaging.service;

import com.agricultural.messaging.model.Conversation;
import com.agricultural.messaging.repository.ConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MessageService {
    
    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * Get all conversations for a user (as customer or farmer)
     */
    public List<Conversation> getUserConversations(String userId) {
        List<Conversation> asCustomer = conversationRepository.findByCustomerIdOrderByLastMessageAtDesc(userId);
        List<Conversation> asFarmer = conversationRepository.findByFarmerIdOrderByLastMessageAtDesc(userId);
        
        // Combine both lists
        asCustomer.addAll(asFarmer);
        
        // Sort by lastMessageAt
        asCustomer.sort((a, b) -> {
            LocalDateTime timeA = a.getLastMessageAt() != null ? a.getLastMessageAt() : a.getCreatedAt();
            LocalDateTime timeB = b.getLastMessageAt() != null ? b.getLastMessageAt() : b.getCreatedAt();
            return timeB.compareTo(timeA);
        });
        
        return asCustomer;
    }
    
    /**
     * Get a specific conversation by ID
     */
    public Optional<Conversation> getConversationById(String conversationId) {
        return conversationRepository.findById(conversationId);
    }
    
    /**
     * Create a new conversation or return existing one
     */
    public Conversation createOrGetConversation(String customerId, String customerName, 
                                                 String farmerId, String farmerName) {
        // Check if conversation already exists
        Optional<Conversation> existing = conversationRepository
                .findByCustomerIdAndFarmerId(customerId, farmerId);
        
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // Create new conversation
        Conversation conversation = new Conversation();
        conversation.setCustomerId(customerId);
        conversation.setCustomerName(customerName);
        conversation.setFarmerId(farmerId);
        conversation.setFarmerName(farmerName);
        conversation.setCreatedAt(LocalDateTime.now());
        
        return conversationRepository.save(conversation);
    }
    
    /**
     * Add a message to a conversation
     */
    public Conversation addMessage(String conversationId, String senderId, 
                                   String senderName, String content) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found with id: " + conversationId));
        
        // Create new message
        Conversation.Message message = new Conversation.Message();
        message.setSenderId(senderId);
        message.setSenderName(senderName);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        message.setIsRead(false);
        
        // Add message to conversation
        conversation.getMessages().add(message);
        conversation.setLastMessageAt(LocalDateTime.now());

        Conversation saved = conversationRepository.save(conversation);

        // Broadcast new message via WebSocket to all subscribers
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, message);
        }

        return saved;
    }

    /**
     * Mark all messages in a conversation as read for a user
     */
    public Conversation markAsRead(String conversationId, String userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found with id: " + conversationId));
        
        // Mark messages from other user as read
        conversation.getMessages().forEach(message -> {
            if (!message.getSenderId().equals(userId)) {
                message.setIsRead(true);
            }
        });
        
        return conversationRepository.save(conversation);
    }
    
    /**
     * Get unread message count for a user
     */
    public int getUnreadCount(String userId) {
        List<Conversation> conversations = getUserConversations(userId);
        
        int count = 0;
        for (Conversation conv : conversations) {
            for (Conversation.Message msg : conv.getMessages()) {
                if (!msg.getSenderId().equals(userId) && !msg.getIsRead()) {
                    count++;
                }
            }
        }
        
        return count;
    }
}
