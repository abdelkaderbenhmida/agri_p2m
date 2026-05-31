package com.agricultural.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    @NotBlank(message = "Email is required")
    @Pattern(
        regexp = "^(?i)(mailto:)?[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
        message = "Email should be valid"
    )
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    public void setEmail(String email) {
        this.email = email == null ? null : email.replaceFirst("(?i)^mailto:", "").trim().toLowerCase();
    }
}
