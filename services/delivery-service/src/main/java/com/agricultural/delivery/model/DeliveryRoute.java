package com.agricultural.delivery.model;

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
@Document(collection = "delivery_routes")
public class DeliveryRoute {
    
    @Id
    private String id;
    
    // Farmer who posted the offer
    private String farmerId;
    private String farmerName;

    // Offer details
    private String description;
    private String destination;
    private Double destinationLat;
    private Double destinationLng;
    private Double quantity;
    private String quantityUnit; // kg, tonne, caisses, pièces
    private Double transportPrice; // in TND

    // Driver tracking
    private Double driverCurrentLat;
    private Double driverCurrentLng;
    private String lastLocationUpdate;

    // Driver assigned after acceptance
    private String driverId;
    private String driverName;
    private String vehicleType;
    private String vehicleNumber;

    private List<DeliveryStop> stops = new ArrayList<>();
    
private List<LogisticsApplication> applications = new ArrayList<>();

    private RouteStatus status;

    private LocalDateTime scheduledDate;
    
    private LocalDateTime startedAt;
    
    private LocalDateTime completedAt;
    
    private Double totalDistance; // in km
    
    private Integer totalOrders;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    public enum RouteStatus {
        PLANNED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliveryStop {
        private String orderId;
        private String customerName;
        private String address;
        private Double latitude;
        private Double longitude;
        private Integer sequenceNumber;
        private StopStatus status;
        private LocalDateTime estimatedArrival;
        private LocalDateTime actualArrival;
        private String notes;
        private String signature;
        
        public enum StopStatus {
            PENDING,
            EN_ROUTE,
            DELIVERED,
            FAILED,
            RESCHEDULED
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogisticsApplication {
        private String applicantId;
        private String applicantName;
        private String applicantEmail;
        private String applicantPhone;
        private String message;
        private String vehicleType;
        private String licenseNumber;
        private ApplicationStatus status = ApplicationStatus.PENDING;
        private String appliedAt;
        private String notes;

        public enum ApplicationStatus {
            PENDING,
            REVIEWED,
            ACCEPTED,
            REJECTED
        }
    }
}
