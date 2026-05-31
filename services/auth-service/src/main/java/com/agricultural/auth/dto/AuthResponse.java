package com.agricultural.auth.dto;

import com.agricultural.auth.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String role;
    private User.Address address;
    private String profileImage;
    private Boolean isVerified;
    private Boolean isActive;
    private User.FarmerProfile farmerProfile;
    
    public AuthResponse(String token, String id, String email, String firstName, String lastName, String role) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
    }
    
    public AuthResponse(String token, User user) {
        this.token = token;
        this.type = "Bearer";
        this.id = user.getId();
        this.email = user.getEmail();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.phone = user.getPhone();
        this.role = user.getRole().name();
        this.address = user.getAddress();
        this.profileImage = user.getProfileImage();
        this.isVerified = user.getIsVerified();
        this.isActive = user.getIsActive();
        this.farmerProfile = user.getFarmerProfile();
    }
}
