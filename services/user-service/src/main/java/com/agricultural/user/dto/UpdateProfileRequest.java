package com.agricultural.user.dto;

import com.agricultural.user.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private User.Address address;
    private User.FarmerProfile farmerProfile;
    private String profileImage;
    private Boolean isActive;
}
