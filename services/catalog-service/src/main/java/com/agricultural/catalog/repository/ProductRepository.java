package com.agricultural.catalog.repository;

import com.agricultural.catalog.domain.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByFarmerId(String farmerId);
    List<Product> findByIsAvailable(Boolean isAvailable);
    List<Product> findByCategoryAndIsAvailable(Product.ProductCategory category, Boolean isAvailable);
    List<Product> findByNameContainingIgnoreCase(String keyword);
}
