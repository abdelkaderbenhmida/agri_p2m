package com.agricultural.payment.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payment_methods")
public class PaymentMethod {
    
    @Id
    private String id;
    
    private String userId;
    
    private PaymentType type;
    
    // For Stripe
    private String stripeCustomerId;
    private String stripePaymentMethodId;
    
    // For card details (encrypted)
    private String cardLast4;
    private String cardBrand; // visa, mastercard, etc.
    private String cardExpMonth;
    private String cardExpYear;
    
    // For bank account
    private String bankName;
    private String accountLast4;
    
    private Boolean isDefault;
    
    private Boolean isActive;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    public enum PaymentType {
        CREDIT_CARD,
        DEBIT_CARD,
        BANK_ACCOUNT,
        MOBILE_MONEY,
        CASH_ON_DELIVERY
    }
}
