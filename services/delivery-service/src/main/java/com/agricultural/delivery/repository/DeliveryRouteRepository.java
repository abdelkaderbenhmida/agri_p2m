package com.agricultural.delivery.repository;

import com.agricultural.delivery.model.DeliveryRoute;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DeliveryRouteRepository extends MongoRepository<DeliveryRoute, String> {
    
    List<DeliveryRoute> findByDriverId(String driverId);

    List<DeliveryRoute> findByFarmerId(String farmerId);

    List<DeliveryRoute> findByStatus(DeliveryRoute.RouteStatus status);
    
    List<DeliveryRoute> findByScheduledDateBetween(LocalDateTime start, LocalDateTime end);
    
    List<DeliveryRoute> findByStatusOrderByScheduledDateAsc(DeliveryRoute.RouteStatus status);
}
