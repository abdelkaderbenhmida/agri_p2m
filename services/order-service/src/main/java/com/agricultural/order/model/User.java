package com.agricultural.order.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String email;
    
    private String password;
    
    private String firstName;
    
    private String lastName;
    
    private String phone;
    
    private UserRole role; // FARMER or CUSTOMER
    
    private Address address;
    
    private String profileImage;
    
    private Boolean isVerified = false;
    
    private Boolean isActive = true;
    
    // Farmer specific fields
    private FarmerProfile farmerProfile;
    
    // Customer specific fields
    private List<String> favoriteProducts = new ArrayList<>();
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    public enum UserRole {
        FARMER, CUSTOMER, ADMIN
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Address {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private String country;
        private Double latitude;
        private Double longitude;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmerProfile {
        private String farmName;
        private String description;
        private String certifications;
        private Double rating = 0.0;
        private Integer totalReviews = 0;
        private String farmImage;
        private Double farmSize = 0.0;
        private List<String> specialties = new ArrayList<>();
        private Double farmLat;
        private Double farmLng;
        private String farmAddress;
    }
}
