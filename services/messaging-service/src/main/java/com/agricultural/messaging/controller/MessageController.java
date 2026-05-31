package com.agricultural.messaging.controller;

import com.agricultural.messaging.dto.ApiResponse;
import com.agricultural.messaging.dto.CreateConversationRequest;
import com.agricultural.messaging.dto.MessageRequest;
import com.agricultural.messaging.model.Conversation;
import com.agricultural.messaging.security.JwtUtils;
import com.agricultural.messaging.service.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    /**
     * Get all conversations for the current user
     */
    @GetMapping("/conversations")
    public ResponseEntity<?> getUserConversations(HttpServletRequest request) {
        try {
            JwtUtils.UserInfo user = jwtUtils.getUserInfo(request);
            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized"));
            }
            
            List<Conversation> conversations = messageService.getUserConversations(user.getId());
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to get conversations: " + e.getMessage()));
        }
    }
    
    /**
     * Get a specific conversation by ID
     */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<?> getConversation(@PathVariable String conversationId) {
        try {
            Conversation conversation = messageService.getConversationById(conversationId)
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));
            
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to get conversation: " + e.getMessage()));
        }
    }
    
    /**
     * Create a new conversation
     */
    @PostMapping("/conversations")
    public ResponseEntity<?> createConversation(@Valid @RequestBody CreateConversationRequest request) {
        try {
            Conversation conversation = messageService.createOrGetConversation(
                    request.getCustomerId(),
                    request.getCustomerName(),
                    request.getFarmerId(),
                    request.getFarmerName()
            );
            
            return ResponseEntity.ok(new ApiResponse(true, "Conversation created successfully", conversation));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to create conversation: " + e.getMessage()));
        }
    }
    
    /**
     * Send a message in a conversation
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@Valid @RequestBody MessageRequest dto, HttpServletRequest request) {
        try {
            JwtUtils.UserInfo user = jwtUtils.getUserInfo(request);
            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized"));
            }
            
            Conversation conversation = messageService.addMessage(
                    dto.getConversationId(),
                    user.getId(),
                    user.getFullName(),
                    dto.getContent()
            );
            
            return ResponseEntity.ok(new ApiResponse(true, "Message sent successfully", conversation));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to send message: " + e.getMessage()));
        }
    }
    
    /**
     * Mark conversation as read
     */
    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String conversationId, HttpServletRequest request) {
        try {
            JwtUtils.UserInfo user = jwtUtils.getUserInfo(request);
            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized"));
            }
            
            Conversation conversation = messageService.markAsRead(conversationId, user.getId());
            
            return ResponseEntity.ok(new ApiResponse(true, "Messages marked as read", conversation));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to mark as read: " + e.getMessage()));
        }
    }
    
    /**
     * Get unread message count for current user
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(HttpServletRequest request) {
        try {
            JwtUtils.UserInfo user = jwtUtils.getUserInfo(request);
            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized"));
            }
            
            int count = messageService.getUnreadCount(user.getId());
            
            return ResponseEntity.ok(new ApiResponse(true, "Unread count retrieved", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to get unread count: " + e.getMessage()));
        }
    }
}
