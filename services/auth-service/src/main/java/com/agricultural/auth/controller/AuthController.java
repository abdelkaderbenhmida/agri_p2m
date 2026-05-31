package com.agricultural.auth.controller;

import com.agricultural.auth.dto.ApiResponse;
import com.agricultural.auth.dto.AuthResponse;
import com.agricultural.auth.dto.LoginRequest;
import com.agricultural.auth.dto.SignupRequest;
import com.agricultural.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Invalid credentials"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Invalid credentials: " + e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest signupRequest) {
        try {
            AuthResponse response = authService.signup(signupRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Signup failed: " + e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        try {
            String token = body.get("token");
            String role = body.get("role");
            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Token Google manquant"));
            }
            AuthResponse response = authService.googleLogin(token, role);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("[Google Auth] Erreur: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Connexion Google échouée: " + e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String emailOrPhone = request.get("email");
            if (emailOrPhone == null || emailOrPhone.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Email ou telephone requis"));
            }
            authService.sendPasswordResetCode(emailOrPhone.trim());
            return ResponseEntity.ok(Map.of("success", true, "message", "Code de reinitialisation envoye a votre email/telephone"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");
            if (email == null || code == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Email et code requis"));
            }
            authService.verifyCodeAndResetPassword(email.trim().toLowerCase(), code.trim(), null);
            return ResponseEntity.ok(new ApiResponse(true, "Code valide"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");
            String newPassword = request.get("newPassword");
            if (email == null || code == null || newPassword == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Email, code et nouveau mot de passe requis"));
            }
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Le mot de passe doit contenir au moins 6 caracteres"));
            }
            authService.verifyCodeAndResetPassword(email.trim().toLowerCase(), code.trim(), newPassword);
            return ResponseEntity.ok(new ApiResponse(true, "Mot de passe reinitialise avec succes"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}