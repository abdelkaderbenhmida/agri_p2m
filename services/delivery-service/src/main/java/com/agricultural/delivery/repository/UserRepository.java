package com.agricultural.delivery.repository;

import com.agricultural.delivery.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Boolean existsByEmail(String email);
    List<User> findByRole(User.UserRole role);
    Long countByRole(User.UserRole role);
    List<User> findByIsActive(Boolean isActive);
}
