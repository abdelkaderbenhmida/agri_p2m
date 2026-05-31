package com.agricultural.user.controller;

import com.agricultural.user.dto.ApiResponse;
import com.agricultural.user.dto.ChangePasswordRequest;
import com.agricultural.user.dto.UpdateProfileRequest;
import com.agricultural.user.model.User;
import com.agricultural.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import jakarta.servlet.http.HttpServletRequest;
import com.agricultural.user.security.JwtUtils;
import com.agricultural.user.security.JwtUtils.UserInfo;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;
    
    /**
     * Get current user profile
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String email = userInfo.getEmail();
            
            User user = userService.getUserByEmail(email);
            // Don't send password in response
            user.setPassword(null);
            
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to get user: " + e.getMessage()));
        }
    }
    
    /**
     * Update user profile
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest reqBody, HttpServletRequest request) {
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String email = userInfo.getEmail();
            
            User currentUser = userService.getUserByEmail(email);
            User updatedUser = userService.updateProfile(currentUser.getId(), reqBody);
            
            // Don't send password in response
            updatedUser.setPassword(null);
            
            return ResponseEntity.ok(new ApiResponse(true, "Profile updated successfully", updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to update profile: " + e.getMessage()));
        }
    }
    
    /**
     * Change password
     */
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest reqBody, HttpServletRequest request) {
        try {
            UserInfo userInfo = jwtUtils.getUserInfo(request);
            if (userInfo == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "Unauthorized: No token provided"));
            }
            String email = userInfo.getEmail();
            
            User currentUser = userService.getUserByEmail(email);
            userService.changePassword(currentUser.getId(), reqBody);
            
            return ResponseEntity.ok(new ApiResponse(true, "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to change password: " + e.getMessage()));
        }
    }
    
    /**
     * Get user by ID (admin or self)
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable String userId) {
        try {
            User user = userService.getUserById(userId);
            // Don't send password in response
            user.setPassword(null);
            
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to get user: " + e.getMessage()));
        }
    }

    /**
     * List all farmers (for customers to contact) or all customers (for farmers)
     * GET /api/users/by-role?role=FARMER  or  ?role=CUSTOMER
     */
    @GetMapping("/by-role")
    public ResponseEntity<?> getUsersByRole(@RequestParam String role) {
        try {
            User.UserRole userRole = User.UserRole.valueOf(role.toUpperCase());
            List<User> users = userService.getUsersByRole(userRole);
            // Remove passwords
            users.forEach(u -> u.setPassword(null));
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Rôle invalide: " + role));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Erreur: " + e.getMessage()));
        }
    }
}
