package com.agricultural.payment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class KonnectPaymentService {

    @Value("${konnect.api.key:}")
    private String apiKey;

    @Value("${konnect.wallet.id:}")
    private String walletId;

    @Value("${konnect.base.url:https://api.preprod.konnect.network/api/v2}")
    private String baseUrl;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${order.service.url:http://order-service:8080}")
    private String orderServiceUrl;

    @Value("${delivery.service.url:http://delivery-service:8086}")
    private String deliveryServiceUrl;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Fetches order data from the order-service via HTTP instead of direct DB access.
     * This respects microservice isolation — orders live in orderdb, not paymentdb.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchOrderFromOrderService(String orderId) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    orderServiceUrl + "/api/orders/" + orderId, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new RuntimeException("Commande introuvable: " + orderId);
            }
            // The order-service may wrap in { success, data } or return the order directly
            if (body.containsKey("data") && body.get("data") instanceof Map) {
                return (Map<String, Object>) body.get("data");
            }
            return body;
        } catch (Exception e) {
            throw new RuntimeException("Impossible de récupérer la commande depuis order-service: " + e.getMessage(), e);
        }
    }

    /**
     * Updates the order status via HTTP call to order-service.
     */
    private void updateOrderViaOrderService(String orderId, String status, String paymentStatus,
                                             String paymentRef, String paymentMethod) {
        try {
            Map<String, Object> updateBody = new LinkedHashMap<>();
            updateBody.put("status", status);
            updateBody.put("paymentStatus", paymentStatus);
            if (paymentRef != null) updateBody.put("paymentRef", paymentRef);
            if (paymentMethod != null) updateBody.put("paymentMethod", paymentMethod);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(updateBody, headers);

            restTemplate.put(orderServiceUrl + "/api/orders/" + orderId + "/status", request);
        } catch (Exception e) {
            System.err.println("Failed to update order via order-service: " + e.getMessage());
        }
    }

    /**
     * Initiates a Konnect payment for the given order.
     * Returns the payUrl to redirect the user to and the paymentRef.
     */
    @SuppressWarnings("unchecked")
    public Map<String, String> initiatePayment(String orderId) {
        Map<String, Object> orderData = fetchOrderFromOrderService(orderId);

        // Get totalAmount from order data
        double totalAmount = 0;
        Object amountObj = orderData.get("totalAmount");
        if (amountObj instanceof Number) {
            totalAmount = ((Number) amountObj).doubleValue();
        }

        // Konnect requires amount in millimes (1 TND = 1000 millimes)
        int amountInMillimes = (int) (totalAmount * 1000);
        String shortId = orderId.substring(0, Math.min(8, orderId.length())).toUpperCase();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("receiverWalletId", walletId);
        body.put("token", "TND");
        body.put("amount", amountInMillimes);
        body.put("type", "immediate");
        body.put("description", "Commande AgriConnect #" + shortId);
        body.put("acceptedPaymentMethods", Arrays.asList("wallet", "bank_card", "e-DINAR"));
        body.put("lifespan", 15); // minutes before link expires
        body.put("checkoutForm", false);
        body.put("orderId", orderId);
        // Konnect will append ?payment_ref=XXX to successUrl
        body.put("successUrl", frontendUrl + "/payment/result?orderId=" + orderId);
        body.put("failUrl", frontendUrl + "/payment/result?orderId=" + orderId + "&failed=true");

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    baseUrl + "/payments/init-payment", request, Map.class);

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Réponse vide de Konnect");
            }

            String payUrl = (String) responseBody.get("payUrl");
            String paymentRef = (String) responseBody.get("paymentRef");

            if (payUrl == null || paymentRef == null) {
                throw new RuntimeException("Réponse Konnect invalide: " + responseBody);
            }

            // Save paymentRef to order via order-service HTTP call
            updateOrderViaOrderService(orderId, null, null, paymentRef, null);

            Map<String, String> result = new HashMap<>();
            result.put("payUrl", payUrl);
            result.put("paymentRef", paymentRef);
            return result;

        } catch (Exception e) {
            throw new RuntimeException("Erreur Konnect: " + e.getMessage(), e);
        }
    }

    /**
     * Verifies a payment with Konnect and updates the order via order-service if successful.
     */
    @SuppressWarnings("unchecked")
    public boolean verifyAndCompletePayment(String paymentRef, String orderId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/payments/" + paymentRef,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class);

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) return false;

            Map<String, Object> payment = (Map<String, Object>) responseBody.get("payment");
            String status = payment != null ? (String) payment.get("status") : null;

            if ("completed".equals(status)) {
                // Fetch current order status from order-service to avoid duplicate processing
                Map<String, Object> orderData = fetchOrderFromOrderService(orderId);
                String currentStatus = (String) orderData.get("status");

                if ("PROCESSING".equals(currentStatus) ||
                    "SHIPPED".equals(currentStatus) ||
                    "DELIVERED".equals(currentStatus)) {
                    return true; // Already processed
                }

                // Update order via order-service
                updateOrderViaOrderService(orderId, "PROCESSING", "PAID", null, "CREDIT_CARD");

                // Notify delivery-service about payment confirmation via HTTP
                try {
                    Map<String, Object> deliveryEvent = new LinkedHashMap<>();
                    deliveryEvent.put("orderId", orderId);
                    deliveryEvent.put("paymentRef", paymentRef);
                    deliveryEvent.put("status", "COMPLETED");

                    HttpHeaders dHeaders = new HttpHeaders();
                    dHeaders.setContentType(MediaType.APPLICATION_JSON);
                    HttpEntity<Map<String, Object>> dRequest = new HttpEntity<>(deliveryEvent, dHeaders);
                    restTemplate.postForEntity(deliveryServiceUrl + "/api/delivery/payment-confirmed", dRequest, Map.class);
                    System.out.println("Notified delivery-service about payment for order " + orderId);
                } catch (Exception e) {
                    System.err.println("Failed to notify delivery-service: " + e.getMessage());
                }

                return true;
            }
            return false;

        } catch (Exception e) {
            System.err.println("Konnect verification error: " + e.getMessage());
            return false;
        }
    }
}
