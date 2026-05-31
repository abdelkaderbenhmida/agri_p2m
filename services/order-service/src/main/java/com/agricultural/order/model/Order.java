package com.agricultural.order.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "orders")
public class Order {
    
    @Id
    private String id;
    
    private String orderNumber;
    
    private User customer;
    
    private String customerId;
    
    private String customerEmail;
    
    private String farmerId;
    
    private String farmerName;
    
    private String farmerEmail;
    
    private List<OrderItem> items = new ArrayList<>();
    
    private Double totalAmount;
    
    private OrderStatus status;
    
    private PaymentStatus paymentStatus;
    
    private PaymentMethod paymentMethod;
    
    private User.Address deliveryAddress;
    
    private String deliveryNotes;
    
    private LocalDateTime estimatedDeliveryDate;
    
    private LocalDateTime actualDeliveryDate;
    
    private List<OrderTracking> trackingHistory = new ArrayList<>();

    // Live driver location tracking
    private Double driverCurrentLat;
    private Double driverCurrentLng;
    private String lastDriverLocationUpdate;

    // Customer receipt confirmation & rating
    private Double rating;
    private String reviewText;

    // Transporter departure info
    private String departureDate;
    private String departureLocation;
    private Double departureLat;
    private Double departureLng;
    private String transporterName;

    // Konnect payment reference
    private String paymentRef;

    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    public enum OrderStatus {
        PENDING,
        CONFIRMED,
        PROCESSING,
        SHIPPED,
        DELIVERED,
        CANCELLED,
        REFUNDED
    }
    
    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED,
        REFUNDED
    }
    
    public enum PaymentMethod {
        CREDIT_CARD,
        DEBIT_CARD,
        PAYPAL,
        CASH_ON_DELIVERY,
        BANK_TRANSFER
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItem {
        private String productId;
        private String productName;
        private String farmerId;
        private String farmerName;
        private Integer quantity;
        private Double price;
        private Double subtotal;
        private String productImage;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderTracking {
        private OrderStatus status;
        private String description;
        private LocalDateTime timestamp;
        private String location;
    }
}
