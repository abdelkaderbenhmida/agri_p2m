package com.agricultural.payment.repository;

import com.agricultural.payment.model.PaymentMethod;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends MongoRepository<PaymentMethod, String> {
    
    List<PaymentMethod> findByUserId(String userId);
    
    List<PaymentMethod> findByUserIdAndIsActive(String userId, Boolean isActive);
    
    Optional<PaymentMethod> findByUserIdAndIsDefault(String userId, Boolean isDefault);
    
    Optional<PaymentMethod> findByStripePaymentMethodId(String stripePaymentMethodId);
}
