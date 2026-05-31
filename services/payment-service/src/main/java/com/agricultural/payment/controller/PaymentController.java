package com.agricultural.payment.controller;

import com.agricultural.payment.model.PaymentMethod;

import com.agricultural.payment.dto.ApiResponse;
import com.agricultural.payment.repository.PaymentMethodRepository;

import com.agricultural.payment.service.KonnectPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import com.agricultural.payment.security.JwtUtils;
import com.agricultural.payment.security.JwtUtils.UserInfo;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private JwtUtils jwtUtils;

    
    @Autowired
    private PaymentMethodRepository paymentMethodRepository;
    


    @Autowired
    private KonnectPaymentService konnectPaymentService;
    @GetMapping("/methods")
    public ResponseEntity<?> getPaymentMethods(HttpServletRequest request) {
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String userId = userInfo.getId();
            
            List<PaymentMethod> methods = paymentMethodRepository.findByUserIdAndIsActive(userId, true);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("paymentMethods", methods);
            response.put("count", methods.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error fetching payment methods: " + e.getMessage()));
        }
    }
    
    // Add payment method
    @PostMapping("/methods")
    public ResponseEntity<?> addPaymentMethod(@RequestBody PaymentMethod paymentMethod, HttpServletRequest request) {
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String userId = userInfo.getId();
            
            paymentMethod.setUserId(userId);
            paymentMethod.setCreatedAt(LocalDateTime.now());
            paymentMethod.setIsActive(true);
            
            // If this is the first payment method or is set as default
            List<PaymentMethod> existingMethods = paymentMethodRepository.findByUserId(userId);
            if (existingMethods.isEmpty() || paymentMethod.getIsDefault()) {
                // Unset other defaults
                existingMethods.forEach(method -> {
                    method.setIsDefault(false);
                    paymentMethodRepository.save(method);
                });
                paymentMethod.setIsDefault(true);
            } else {
                paymentMethod.setIsDefault(false);
            }
            
            PaymentMethod savedMethod = paymentMethodRepository.save(paymentMethod);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "message", "Payment method added successfully", "paymentMethod", savedMethod));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error adding payment method: " + e.getMessage()));
        }
    }
    
    // Set default payment method
    @PutMapping("/methods/{id}/set-default")
    public ResponseEntity<?> setDefaultPaymentMethod(@PathVariable String id, HttpServletRequest request) {
        try{
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String userId = userInfo.getId();
            Optional<PaymentMethod> methodOpt = paymentMethodRepository.findById(id);
            
            if (methodOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Payment method not found"));
            }
            
            PaymentMethod method = methodOpt.get();
            
            if (!method.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied"));
            }
            
            // Unset other defaults
            List<PaymentMethod> userMethods = paymentMethodRepository.findByUserId(userId);
            userMethods.forEach(m -> {
                m.setIsDefault(false);
                paymentMethodRepository.save(m);
            });
            
            // Set this as default
            method.setIsDefault(true);
            paymentMethodRepository.save(method);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Default payment method updated"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error setting default payment method: " + e.getMessage()));
        }
    }
    
    // Delete payment method
    @DeleteMapping("/methods/{id}")
    public ResponseEntity<?> deletePaymentMethod(@PathVariable String id, HttpServletRequest request) {
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String userId = userInfo.getId();
            Optional<PaymentMethod> methodOpt = paymentMethodRepository.findById(id);
            
            if (methodOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Payment method not found"));
            }
            
            PaymentMethod method = methodOpt.get();
            
            if (!method.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied"));
            }
            
            // Mark as inactive instead of deleting
            method.setIsActive(false);
            paymentMethodRepository.save(method);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Payment method removed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error removing payment method: " + e.getMessage()));
        }
    }
    
    // Create payment intent (for Stripe)
    @PostMapping("/create-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> paymentData, HttpServletRequest request) {
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            // In a real implementation, you would use Stripe SDK here
            // This is a placeholder response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("clientSecret", "placeholder_client_secret_" + System.currentTimeMillis());
            response.put("message", "Payment intent created. Note: Stripe integration requires API key configuration.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error creating payment intent: " + e.getMessage()));
        }
    }
    
    // Get Stripe publishable key
    @GetMapping("/config")
    public ResponseEntity<?> getPaymentConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("success", true);
        config.put("publishableKey", "pk_test_placeholder");
        config.put("message", "Configure your Stripe keys in application.properties");
        return ResponseEntity.ok(config);
    }

    // ---------------------------------------------------------------
    // Konnect Payment Gateway (Tunisia)
    // ---------------------------------------------------------------

    /**
     * Receives order-created notification from order-service (replaces RabbitMQ event).
     * POST /api/payments/order-created
     */
    @PostMapping("/order-created")
    public ResponseEntity<?> onOrderCreated(@RequestBody Map<String, Object> orderEvent) {
        String orderId = (String) orderEvent.get("orderId");
        String orderNumber = (String) orderEvent.get("orderNumber");
        String customerEmail = (String) orderEvent.get("customerEmail");
        Object totalAmount = orderEvent.get("totalAmount");

        System.out.println("==============================================");
        System.out.println("HTTP EVENT RECEIVED: Order Created!");
        System.out.println("Order ID: " + orderId);
        System.out.println("Order Number: " + orderNumber);
        System.out.println("Customer Email: " + customerEmail);
        System.out.println("Total Amount: " + totalAmount);
        System.out.println("==============================================");

        try {
            // Optionally auto-initiate payment preparation
            System.out.println("Payment preparation triggered for order: " + orderId);
        } catch (Exception e) {
            System.err.println("Failed to process order notification: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Order event received"));
    }

    /**
     * Initiate a Konnect payment for an order.
     * POST /api/payments/konnect/initiate/{orderId}
     * Returns { payUrl, paymentRef } — frontend must redirect to payUrl.
     */
    @PostMapping("/konnect/initiate/{orderId}")
    public ResponseEntity<?> initiateKonnectPayment(@PathVariable String orderId) {
        try {
            Map<String, String> result = konnectPaymentService.initiatePayment(orderId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verify a Konnect payment after the user is redirected back.
     * GET /api/payments/konnect/verify?ref=PAYMENT_REF&orderId=ORDER_ID
     * Returns { success: true/false }
     */
    @GetMapping("/konnect/verify")
    public ResponseEntity<?> verifyKonnectPayment(
            @RequestParam String ref,
            @RequestParam String orderId) {
        try {
            boolean success = konnectPaymentService.verifyAndCompletePayment(ref, orderId);
            return ResponseEntity.ok(Map.of("success", success));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
