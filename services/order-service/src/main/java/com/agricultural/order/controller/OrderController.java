package com.agricultural.order.controller;

import com.agricultural.order.dto.ApiResponse;
import com.agricultural.order.model.Order;
import com.agricultural.order.model.User;
import com.agricultural.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import com.agricultural.order.security.JwtUtils;
import com.agricultural.order.security.JwtUtils.UserInfo;

import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private JwtUtils jwtUtils;

    
    @Autowired
    private OrderService orderService;
    
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest orderRequest,
                                        HttpServletRequest request) {
        CreateOrderRequest reqBody = orderRequest;
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String email = userInfo.getEmail();
            Order order = orderService.createOrder(
                    reqBody.getItems(),
                    reqBody.getDeliveryAddress(),
                    reqBody.getDeliveryNotes(),
                    email,
                    reqBody.getPaymentMethod()
            );
            return ResponseEntity.ok(new ApiResponse(true, "Order created successfully", order));
            } catch (DataAccessException e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ApiResponse(false, "Order database temporarily unavailable. Please retry."));
        } catch (Exception e) {
            e.printStackTrace(); return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to create order: " + e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<?> getMyOrders(HttpServletRequest request) {
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String email = userInfo.getEmail();
            return ResponseEntity.ok(orderService.getCustomerOrders(email));
        } catch (DataAccessException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ApiResponse(false, "Order database temporarily unavailable. Please retry."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to fetch orders: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable String id,
                                               @RequestParam(required = false) Order.OrderStatus status,
                                               @RequestParam(required = false) String description,
                                               @RequestBody(required = false) Map<String, Object> body) {
        try {
            // Support both @RequestParam (frontend) and @RequestBody (inter-service)
            Order.OrderStatus resolvedStatus = status;
            String resolvedDescription = description;
            String paymentStatus = null;
            String paymentRef = null;
            String paymentMethod = null;

            if (body != null) {
                if (resolvedStatus == null && body.get("status") != null) {
                    resolvedStatus = Order.OrderStatus.valueOf(body.get("status").toString());
                }
                if (resolvedDescription == null && body.get("description") != null) {
                    resolvedDescription = body.get("description").toString();
                }
                paymentStatus = body.get("paymentStatus") != null ? body.get("paymentStatus").toString() : null;
                paymentRef = body.get("paymentRef") != null ? body.get("paymentRef").toString() : null;
                paymentMethod = body.get("paymentMethod") != null ? body.get("paymentMethod").toString() : null;
            }

            Order order = orderService.getOrderById(id);

            // Apply payment-specific fields if provided (from payment-service)
            if (paymentStatus != null) {
                order.setPaymentStatus(Order.PaymentStatus.valueOf(paymentStatus));
            }
            if (paymentRef != null) {
                order.setPaymentRef(paymentRef);
            }
            if (paymentMethod != null) {
                try {
                    order.setPaymentMethod(Order.PaymentMethod.valueOf(paymentMethod));
                } catch (IllegalArgumentException ignored) {}
            }

            if (resolvedStatus != null) {
                order.setStatus(resolvedStatus);
                Order.OrderTracking tracking = new Order.OrderTracking();
                tracking.setStatus(resolvedStatus);
                tracking.setDescription(resolvedDescription != null ? resolvedDescription : "Status updated");
                tracking.setTimestamp(LocalDateTime.now());
                order.getTrackingHistory().add(tracking);
            }

            Order saved = orderService.saveOrder(order);
            return ResponseEntity.ok(new ApiResponse(true, "Order status updated", saved));
        } catch (Exception e) {
            e.printStackTrace(); return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to update order: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelOrder(@PathVariable String id, HttpServletRequest request) {
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String email = userInfo.getEmail();
            Order order = orderService.cancelOrder(id, email);
            return ResponseEntity.ok(new ApiResponse(true, "Order cancelled successfully", order));
        } catch (Exception e) {
            e.printStackTrace(); return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to cancel order: " + e.getMessage()));
        }
    }
    
    @GetMapping("/farmer/my-orders")
    public ResponseEntity<?> getMyFarmerOrders(HttpServletRequest request) {
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String farmerId = userInfo.getId();
            return ResponseEntity.ok(orderService.getFarmerOrdersById(farmerId));
        } catch (DataAccessException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ApiResponse(false, "Order database temporarily unavailable. Please retry."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to fetch farmer orders: " + e.getMessage()));
        }
    }
    
    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<Order>> getFarmerOrders(@PathVariable String farmerId) {
        return ResponseEntity.ok(orderService.getFarmerOrdersById(farmerId));
    }

    @PutMapping("/{id}/driver-location")
    public ResponseEntity<?> updateOrderDriverLocation(@PathVariable String id,
                                                       @RequestBody Map<String, Double> body) {
        try {
            Order order = orderService.getOrderById(id);
            order.setDriverCurrentLat(body.get("lat"));
            order.setDriverCurrentLng(body.get("lng"));
            order.setLastDriverLocationUpdate(LocalDateTime.now().toString());
            // Save via orderService — use a simple update method
            Order saved = orderService.saveOrder(order);
            return ResponseEntity.ok(new ApiResponse(true, "Location updated", saved));
        } catch (Exception e) {
            e.printStackTrace(); return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/confirm-receipt")
    public ResponseEntity<?> confirmReceipt(@PathVariable String id) {
        try {
            Order order = orderService.confirmReceipt(id);
            return ResponseEntity.ok(new ApiResponse(true, "Réception confirmée", order));
        } catch (Exception e) {
            e.printStackTrace(); return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}/rate")
    public ResponseEntity<?> rateOrder(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            Double rating = Double.valueOf(body.get("rating").toString());
            String reviewText = body.get("reviewText") != null ? body.get("reviewText").toString() : "";
            Order order = orderService.rateOrder(id, rating, reviewText);
            return ResponseEntity.ok(new ApiResponse(true, "Évaluation enregistrée", order));
        } catch (Exception e) {
            e.printStackTrace(); return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}/departure")
    public ResponseEntity<?> setDeparture(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            String departureDate = body.get("departureDate") != null ? body.get("departureDate").toString() : null;
            String departureLocation = body.get("departureLocation") != null ? body.get("departureLocation").toString() : null;
            String transporterName = body.get("transporterName") != null ? body.get("transporterName").toString() : null;
            Order order = orderService.setDeparture(id, departureDate, departureLocation, transporterName);
            return ResponseEntity.ok(new ApiResponse(true, "Départ défini", order));
        } catch (Exception e) {
            e.printStackTrace(); return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Inner class for request body
    public static class CreateOrderRequest {
        private List<Order.OrderItem> items;
        private User.Address deliveryAddress;
        private String deliveryNotes;
        private String paymentMethod;
        
        public List<Order.OrderItem> getItems() { return items; }
        public void setItems(List<Order.OrderItem> items) { this.items = items; }
        
        public User.Address getDeliveryAddress() { return deliveryAddress; }
        public void setDeliveryAddress(User.Address deliveryAddress) { this.deliveryAddress = deliveryAddress; }
        
        public String getDeliveryNotes() { return deliveryNotes; }
        public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }

        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }
}
