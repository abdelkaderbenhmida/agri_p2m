package com.agricultural.delivery.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtUtils {

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    public UserInfo getUserInfo(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                UserInfo info = new UserInfo();
                info.setEmail(claims.getSubject());
                info.setId(claims.get("userId", String.class));
                if (info.getId() == null) info.setId(claims.getSubject()); // Fallback
                
                info.setRole(claims.get("role", String.class));
                info.setFirstName(claims.get("firstName", String.class));
                if (info.getFirstName() == null) info.setFirstName("User");
                
                info.setLastName(claims.get("lastName", String.class));
                if (info.getLastName() == null) info.setLastName("");
                
                return info;
            } catch (Exception e) {
                // Return null if invalid
            }
        }
        return null;
    }

    public static class UserInfo {
        private String id;
        private String email;
        private String role;
        private String firstName;
        private String lastName;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getFullName() {
            return (firstName + " " + lastName).trim();
        }
    }
}
