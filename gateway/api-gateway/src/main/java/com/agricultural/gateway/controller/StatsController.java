package com.agricultural.gateway.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${USER_SERVICE_URI:http://user-service:8088}")
    private String userServiceUri;

    @Value("${CATALOG_SERVICE_URI:http://catalog-service:8080}")
    private String catalogServiceUri;

    @Value("${ORDER_SERVICE_URI:http://order-service:8080}")
    private String orderServiceUri;

    public StatsController(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    @GetMapping("/global")
    public Mono<Map<String, Object>> getGlobalStats() {
        Mono<ArrayNode> farmersMono = fetchArray(userServiceUri + "/api/users/by-role?role=FARMER");
        Mono<ArrayNode> productsMono = fetchArray(catalogServiceUri + "/api/products/public/all");
        Mono<Set<String>> farmerIdsMono = Mono.zip(farmersMono, productsMono)
            .map(tuple -> collectFarmerIds(tuple.getT1(), tuple.getT2()));
        Mono<ArrayNode> ordersMono = farmerIdsMono.flatMap(this::fetchOrdersForFarmerIds);

        return Mono.zip(farmersMono, productsMono, farmerIdsMono, ordersMono)
                .map(tuple -> {
                    ArrayNode products = tuple.getT2();
                Set<String> farmerIds = tuple.getT3();
                ArrayNode orders = tuple.getT4();

                int totalFarmers = farmerIds.size();
                    int totalProducts = products.size();
                    int totalOrders = countUniqueOrders(orders);
                    double averageRating = calculateAverageRating(orders, products);

                    Map<String, Object> stats = new LinkedHashMap<>();
                    stats.put("totalFarmers", totalFarmers);
                    stats.put("totalProducts", totalProducts);
                    stats.put("totalOrders", totalOrders);
                    stats.put("averageRating", averageRating);
                    return stats;
                });
    }

    private Set<String> collectFarmerIds(ArrayNode farmers, ArrayNode products) {
        Set<String> farmerIds = new HashSet<>();

        for (JsonNode farmer : farmers) {
            String id = farmer.path("id").asText("");
            if (!id.isBlank()) {
                farmerIds.add(id);
            }
        }

        for (JsonNode product : products) {
            String farmerId = product.path("farmerId").asText("");
            if (!farmerId.isBlank()) {
                farmerIds.add(farmerId);
            }
        }

        return farmerIds;
    }

    private Mono<ArrayNode> fetchOrdersForFarmerIds(Set<String> farmerIds) {
        return Flux.fromIterable(farmerIds)
                .flatMap(farmerId -> {
                    String encodedFarmerId = URLEncoder.encode(farmerId, StandardCharsets.UTF_8);
                    return fetchArray(orderServiceUri + "/api/orders/farmer/" + encodedFarmerId);
                })
                .flatMapIterable(arrayNode -> arrayNode)
                .collectList()
                .map(orderNodes -> {
                    ArrayNode merged = objectMapper.createArrayNode();
                    orderNodes.forEach(merged::add);
                    return merged;
                });
    }

    private Mono<ArrayNode> fetchArray(String uri) {
        ArrayNode empty = objectMapper.createArrayNode();

        return webClient.get()
            .uri(Objects.requireNonNull(uri))
                .accept(MediaType.APPLICATION_JSON)
                .exchangeToMono(response -> {
                    if (!response.statusCode().is2xxSuccessful()) {
                        return Mono.just(empty);
                    }
                    return response.bodyToMono(JsonNode.class)
                            .map(this::asArrayOrEmpty)
                            .defaultIfEmpty(empty);
                })
                .timeout(Duration.ofSeconds(5), Mono.just(empty))
                .onErrorResume(ex -> Mono.just(empty));
    }

    private ArrayNode asArrayOrEmpty(JsonNode node) {
        if (node != null && node.isArray()) {
            return (ArrayNode) node;
        }
        return objectMapper.createArrayNode();
    }

    private int countUniqueOrders(ArrayNode orders) {
        Set<String> seenOrderIds = new HashSet<>();
        for (JsonNode order : orders) {
            String orderId = order.path("id").asText("");
            if (!orderId.isBlank()) {
                seenOrderIds.add(orderId);
            }
        }
        return seenOrderIds.size();
    }

    private double calculateAverageRating(ArrayNode orders, ArrayNode products) {
        double sum = 0.0;
        int count = 0;

        Set<String> seenOrderIds = new HashSet<>();
        for (JsonNode order : orders) {
            String orderId = order.path("id").asText("");
            if (!orderId.isBlank() && !seenOrderIds.add(orderId)) {
                continue;
            }

            JsonNode ratingNode = order.get("rating");
            if (ratingNode != null && ratingNode.isNumber()) {
                double rating = ratingNode.asDouble();
                if (rating > 0.0) {
                    sum += rating;
                    count++;
                }
            }
        }

        if (count == 0) {
            for (JsonNode product : products) {
                JsonNode ratingNode = product.get("rating");
                if (ratingNode != null && ratingNode.isNumber()) {
                    double rating = ratingNode.asDouble();
                    if (rating > 0.0) {
                        sum += rating;
                        count++;
                    }
                }
            }
        }

        if (count == 0) {
            return 0.0;
        }

        double avg = sum / count;
        return Math.round(avg * 10.0) / 10.0;
    }
}
