package com.agricultural.order.repository;

import com.agricultural.order.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByFarmerId(String farmerId);
    List<Product> findByCategory(Product.ProductCategory category);
    List<Product> findByIsAvailable(Boolean isAvailable);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByIsOrganic(Boolean isOrganic);
    List<Product> findByCategoryAndIsAvailable(Product.ProductCategory category, Boolean isAvailable);
}
