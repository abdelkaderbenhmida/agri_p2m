package com.agricultural.messaging.repository;

import com.agricultural.messaging.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    List<Conversation> findByCustomerId(String customerId);
    List<Conversation> findByCustomerIdOrderByLastMessageAtDesc(String customerId);
    List<Conversation> findByFarmerId(String farmerId);
    List<Conversation> findByFarmerIdOrderByLastMessageAtDesc(String farmerId);
    Optional<Conversation> findByCustomerIdAndFarmerId(String customerId, String farmerId);
}
