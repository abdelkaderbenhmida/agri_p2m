package com.agricultural.catalog.service;

import com.agricultural.catalog.domain.Product;
import com.agricultural.catalog.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findByIsAvailable(true);
    }
    
    public List<Product> getAll() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(String id) {
        return productRepository.findById(id);
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public void deleteProduct(String id) {
        productRepository.deleteById(id);
    }
    
    public List<Product> getProductsByCategory(Product.ProductCategory category) {
        return productRepository.findByCategoryAndIsAvailable(category, true);
    }
    
    public List<Product> getProductsByFarmer(String farmerId) {
        return productRepository.findByFarmerId(farmerId);
    }
    
    public List<Product> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword);
    }
}
