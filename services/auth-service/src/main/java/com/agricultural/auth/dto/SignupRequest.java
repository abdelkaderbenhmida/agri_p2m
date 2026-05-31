package com.agricultural.auth.dto;

import com.agricultural.auth.model.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {
    
    @NotBlank(message = "Email is required")
    @Pattern(
        regexp = "^(?i)(mailto:)?[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
        message = "Email should be valid"
    )
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    @NotBlank(message = "Phone is required")
    private String phone;
    
    @NotNull(message = "Role is required")
    private User.UserRole role;
    
    private User.Address address;
    
    // Farmer-specific fields
    private String farmName;
    private String farmDescription;

    public void setEmail(String email) {
        this.email = email == null ? null : email.replaceFirst("(?i)^mailto:", "").trim().toLowerCase();
    }
}
