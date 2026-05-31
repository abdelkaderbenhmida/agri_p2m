package com.agricultural.order.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "products")
public class Product {
    
    @Id
    private String id;
    
    private String name;
    
    private String description;
    
    private ProductCategory category;
    
    private Double price;
    
    private String unit; // kg, piece, liter, etc.
    
    private Integer stock;
    
    private List<String> images = new ArrayList<>();
    
    @DBRef
    private User farmer;
    
    private String farmerId; // For easier queries
    
    private Boolean isOrganic = false;
    
    private Boolean isAvailable = true;
    
    private Double rating = 0.0;
    
    private Integer totalReviews = 0;
    
    private List<Review> reviews = new ArrayList<>();
    
    private String location;
    
    private LocalDateTime harvestDate;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    public enum ProductCategory {
        VEGETABLES,
        FRUITS,
        GRAINS,
        DAIRY,
        MEAT,
        POULTRY,
        EGGS,
        HONEY,
        HERBS,
        FLOWERS,
        SEEDS,
        OTHER
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Review {
        private String customerId;
        private String customerName;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
    }
}
