package com.agricultural.messaging.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "conversations")
public class Conversation {
    
    @Id
    private String id;
    
    private String customerId;
    
    private String customerName;
    
    private String farmerId;
    
    private String farmerName;
    
    private List<Message> messages = new ArrayList<>();
    
    private LocalDateTime lastMessageAt;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        private String senderId;
        private String senderName;
        private String content;
        private LocalDateTime timestamp;
        private Boolean isRead = false;
    }
}
