package com.agricultural.catalog.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "products")
public class Product {
    
    @Id
    private String id;
    private String name;
    private String description;
    private ProductCategory category;
    private BigDecimal price;
    private String unit;
    private Integer stock;
    private List<String> images = new ArrayList<>();
    
    private String farmerId;
    
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

    public Product() {}

    public enum ProductCategory {
        VEGETABLES, FRUITS, GRAINS, DAIRY, MEAT, POULTRY, EGGS, HONEY, HERBS, FLOWERS, SEEDS, OTHER
    }
    
    public static class Review {
        private String customerId;
        private String customerName;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
        public Review() {}
        public String getCustomerId() { return customerId; }
        public void setCustomerId(String id) { this.customerId = id; }
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String n) { this.customerName = n; }
        public Integer getRating() { return rating; }
        public void setRating(Integer r) { this.rating = r; }
        public String getComment() { return comment; }
        public void setComment(String c) { this.comment = c; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime d) { this.createdAt = d; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ProductCategory getCategory() { return category; }
    public void setCategory(ProductCategory category) { this.category = category; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }
    public String getFarmerId() { return farmerId; }
    public void setFarmerId(String farmerId) { this.farmerId = farmerId; }
    public Boolean getIsOrganic() { return isOrganic; }
    public void setIsOrganic(Boolean isOrganic) { this.isOrganic = isOrganic; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }
    public List<Review> getReviews() { return reviews; }
    public void setReviews(List<Review> reviews) { this.reviews = reviews; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public LocalDateTime getHarvestDate() { return harvestDate; }
    public void setHarvestDate(LocalDateTime harvestDate) { this.harvestDate = harvestDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
