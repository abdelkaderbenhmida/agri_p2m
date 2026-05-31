package com.agricultural.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentConfirmedEvent {
    private String orderId;
    private String paymentRef;
    private Double amount;
    private String status;
}
