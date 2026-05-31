package com.agricultural.order.service;

import com.agricultural.order.model.Order;
import com.agricultural.order.model.Product;
import com.agricultural.order.model.User;
import com.agricultural.order.repository.OrderRepository;
import com.agricultural.order.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    

    @Value("${payment.service.url:http://payment-service:8080}")
    private String paymentServiceUrl;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ShippoService shippoService;
    
    public Order createOrder(List<Order.OrderItem> items, User.Address deliveryAddress, 
                           String deliveryNotes, String customerEmail, String paymentMethod) {
        // Build a lightweight customer object from the JWT-provided email
        // (no local user DB query — this is a microservice with its own isolated DB)
        User customer = new User();
        customer.setId("customer-" + customerEmail.hashCode());
        customer.setEmail(customerEmail);
        
        double totalAmount = 0.0;
        for (Order.OrderItem item : items) {
            if (item.getPrice() == null) item.setPrice(0.0);
            if (item.getQuantity() == null) item.setQuantity(1);
            item.setSubtotal(item.getPrice() * item.getQuantity());
            totalAmount += item.getSubtotal();
        }
        
        Order order = new Order();
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setCustomer(customer);
        order.setCustomerId(customer.getId());
        order.setCustomerEmail(customerEmail);
        order.setItems(items);
        order.setTotalAmount(totalAmount);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
        if (paymentMethod != null && !paymentMethod.isEmpty()) {
            try {
                order.setPaymentMethod(mapPaymentMethod(paymentMethod));
            } catch (IllegalArgumentException e) {
                // Default to CASH_ON_DELIVERY if mapping fails
                order.setPaymentMethod(Order.PaymentMethod.CASH_ON_DELIVERY);
            }
        }
        order.setDeliveryAddress(deliveryAddress);
        order.setDeliveryNotes(deliveryNotes);
        order.setEstimatedDeliveryDate(LocalDateTime.now().plusDays(3));
        
        // Set farmer info from first item (assuming all items from same farmer)
        if (!items.isEmpty() && items.get(0).getFarmerId() != null) {
            order.setFarmerId(items.get(0).getFarmerId());
            order.setFarmerName(items.get(0).getFarmerName());
        }
        
        // Add initial tracking
        Order.OrderTracking tracking = new Order.OrderTracking();
        tracking.setStatus(Order.OrderStatus.PENDING);
        tracking.setDescription("Order placed successfully");
        tracking.setTimestamp(LocalDateTime.now());
        tracking.setLocation("Agricultural Marketplace Platform");
        order.getTrackingHistory().add(tracking);
        
        Order savedOrder = orderRepository.save(order);
        
        // Calculate shipping with Shippo API
        try {
            shippoService.calculateShipping(savedOrder);
        } catch (Exception e) {
            System.err.println("Failed to calculate shipping: " + e.getMessage());
        }
        
        // Notify payment-service about new order via HTTP
        try {
            Map<String, Object> orderEvent = new LinkedHashMap<>();
            orderEvent.put("orderId", savedOrder.getId());
            orderEvent.put("orderNumber", savedOrder.getOrderNumber());
            orderEvent.put("customerId", savedOrder.getCustomerId());
            orderEvent.put("customerEmail", savedOrder.getCustomerEmail());
            orderEvent.put("totalAmount", savedOrder.getTotalAmount());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(orderEvent, headers);
            restTemplate.postForEntity(paymentServiceUrl + "/api/payments/order-created", request, Map.class);
            System.out.println("Notified payment-service about order " + savedOrder.getId());
        } catch (Exception e) {
            System.err.println("Failed to notify payment-service: " + e.getMessage());
        }
        
        return savedOrder;
    }
    
    /**
     * Get customer orders using email stored directly on the order
     * (no UserRepository needed — microservice has its own isolated DB)
     */
    public List<Order> getCustomerOrders(String customerEmail) {
        return orderRepository.findByCustomerEmailOrderByCreatedAtDesc(customerEmail);
    }
    
    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }
    
    public Order updateOrderStatus(String orderId, Order.OrderStatus status, String description) {
        Order order = getOrderById(orderId);
        order.setStatus(status);
        
        Order.OrderTracking tracking = new Order.OrderTracking();
        tracking.setStatus(status);
        tracking.setDescription(description);
        tracking.setTimestamp(LocalDateTime.now());
        order.getTrackingHistory().add(tracking);
        
        if (status == Order.OrderStatus.DELIVERED) {
            order.setActualDeliveryDate(LocalDateTime.now());
        }
        
        return orderRepository.save(order);
    }
    
    public Order cancelOrder(String orderId, String customerEmail) {
        Order order = getOrderById(orderId);
        
        // Verify ownership using email stored on the order (no UserRepository query)
        if (!customerEmail.equals(order.getCustomerEmail())) {
            throw new RuntimeException("You can only cancel your own orders");
        }
        
        if (order.getStatus() == Order.OrderStatus.DELIVERED || 
            order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("Cannot cancel this order");
        }
        
        // Stock restoration should be handled via HTTP call to catalog-service
        return updateOrderStatus(orderId, Order.OrderStatus.CANCELLED, "Order cancelled by customer");
    }
    
    /**
     * Get farmer orders using farmerId stored directly on the order
     */
    public List<Order> getFarmerOrders(String farmerEmail) {
        return orderRepository.findByFarmerEmailOrderByCreatedAtDesc(farmerEmail);
    }
    
    public List<Order> getFarmerOrdersById(String farmerId) {
        return orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
    }

    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }

    public Order confirmReceipt(String orderId) {
        Order order = getOrderById(orderId);
        order.setStatus(Order.OrderStatus.DELIVERED);
        order.setActualDeliveryDate(LocalDateTime.now());
        Order.OrderTracking tracking = new Order.OrderTracking();
        tracking.setStatus(Order.OrderStatus.DELIVERED);
        tracking.setDescription("Réception confirmée par le client");
        tracking.setTimestamp(LocalDateTime.now());
        order.getTrackingHistory().add(tracking);
        return orderRepository.save(order);
    }

    public Order rateOrder(String orderId, Double rating, String reviewText) {
        Order order = getOrderById(orderId);
        order.setRating(rating);
        order.setReviewText(reviewText);
        return orderRepository.save(order);
    }

    public Order setDeparture(String orderId, String departureDate, String departureLocation,
                              String transporterName) {
        Order order = getOrderById(orderId);
        order.setDepartureDate(departureDate);
        order.setDepartureLocation(departureLocation);
        order.setTransporterName(transporterName);
        order.setStatus(Order.OrderStatus.SHIPPED);
        Order.OrderTracking tracking = new Order.OrderTracking();
        tracking.setStatus(Order.OrderStatus.SHIPPED);
        tracking.setDescription("Colis expédié" +
            (transporterName != null && !transporterName.isEmpty() ? " par " + transporterName : "") +
            (departureLocation != null ? " depuis " + departureLocation : ""));
        tracking.setTimestamp(LocalDateTime.now());
        tracking.setLocation(departureLocation);
        order.getTrackingHistory().add(tracking);
        return orderRepository.save(order);
    }

    /**
     * Maps frontend payment method strings ('cash', 'card', 'mobile')
     * to the corresponding Order.PaymentMethod enum values.
     */
    private Order.PaymentMethod mapPaymentMethod(String method) {
        if (method == null || method.isEmpty()) {
            return Order.PaymentMethod.CASH_ON_DELIVERY;
        }
        switch (method.toLowerCase()) {
            case "cash":
                return Order.PaymentMethod.CASH_ON_DELIVERY;
            case "card":
                return Order.PaymentMethod.CREDIT_CARD;
            case "mobile":
                return Order.PaymentMethod.BANK_TRANSFER;
            default:
                // Try direct enum match (e.g. "CREDIT_CARD")
                return Order.PaymentMethod.valueOf(method.toUpperCase());
        }
    }
}
