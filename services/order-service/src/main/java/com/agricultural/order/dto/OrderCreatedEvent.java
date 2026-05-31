package com.agricultural.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreatedEvent {
    private String orderId;
    private String orderNumber;
    private String customerId;
    private String customerEmail;
    private Double totalAmount;
}
