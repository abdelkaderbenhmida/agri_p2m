package com.agricultural.auth.service;

import com.agricultural.auth.dto.LoginRequest;
import com.agricultural.auth.dto.SignupRequest;
import com.agricultural.auth.dto.AuthResponse;
import com.agricultural.auth.model.PasswordResetToken;
import com.agricultural.auth.model.User;
import com.agricultural.auth.repository.PasswordResetTokenRepository;
import com.agricultural.auth.repository.UserRepository;
import com.agricultural.auth.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.security.SecureRandom;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository resetTokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SmsService smsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Value("${app.reset-code.expiry-minutes:15}")
    private int resetCodeExpiryMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    private String normalizeEmail(String value) {
        return value == null ? null : value.replaceFirst("(?i)^mailto:", "").trim().toLowerCase();
    }

    public AuthResponse login(LoginRequest loginRequest) {
        String email = normalizeEmail(loginRequest.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        email,
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String jwt = tokenProvider.generateTokenWithClaims(user);

        return new AuthResponse(jwt, user);
    }

    public AuthResponse signup(SignupRequest signupRequest) {
        String email = normalizeEmail(signupRequest.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        user.setFirstName(signupRequest.getFirstName());
        user.setLastName(signupRequest.getLastName());
        user.setPhone(signupRequest.getPhone());
        user.setRole(signupRequest.getRole());
        user.setAddress(signupRequest.getAddress());
        user.setIsActive(true);
        user.setIsVerified(false);

        if (signupRequest.getRole() == User.UserRole.FARMER && signupRequest.getFarmName() != null) {
            User.FarmerProfile farmerProfile = new User.FarmerProfile();
            farmerProfile.setFarmName(signupRequest.getFarmName());
            farmerProfile.setDescription(signupRequest.getFarmDescription());
            user.setFarmerProfile(farmerProfile);
        }

        User savedUser = userRepository.save(user);
        String jwt = tokenProvider.generateTokenWithClaims(savedUser);

        return new AuthResponse(jwt, savedUser);
    }

    public AuthResponse googleLogin(String idToken, String role) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = restTemplate.getForObject(url, Map.class);

        if (payload == null || payload.containsKey("error_description")) {
            throw new RuntimeException("Token Google invalide ou expire");
        }

        String email = (String) payload.get("email");
        String firstName = (String) payload.getOrDefault("given_name", "");
        String lastName = (String) payload.getOrDefault("family_name", "");

        Optional<User> existing = userRepository.findByEmail(email);
        User user;
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            User.UserRole userRole = "FARMER".equals(role) ? User.UserRole.FARMER : User.UserRole.CUSTOMER;
            user = new User();
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPassword(passwordEncoder.encode(email + "_google_oauth"));
            user.setRole(userRole);
            user.setIsActive(true);
            user.setIsVerified(true);
            user = userRepository.save(user);
        }

        String jwt = tokenProvider.generateTokenWithClaims(user);
        return new AuthResponse(jwt, user);
    }

    public void sendPasswordResetCode(String emailOrPhone) {
        String identifier = emailOrPhone == null ? "" : emailOrPhone.trim();
        String normalizedEmail = normalizeEmail(identifier);

        // Chercher par email ou par telephone
        User user = userRepository.findByEmail(normalizedEmail)
            .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new RuntimeException("Aucun compte trouve avec cet email ou telephone"));

        String email = user.getEmail();
        resetTokenRepository.deleteByEmail(email);

        String code = String.format("%06d", secureRandom.nextInt(999999));

        PasswordResetToken resetToken = new PasswordResetToken(email, code, resetCodeExpiryMinutes);
        resetTokenRepository.save(resetToken);

        // Envoyer SMS si l'utilisateur a un telephone
        if (user.getPhone() != null && !user.getPhone().isEmpty()) {
            try {
                smsService.sendSmsCode(user.getPhone(), code);
            } catch (Exception ignored) {
                // SMS echoue, le code est retourne a l'ecran
            }
        }

        // Essayer email aussi
        try {
            emailService.sendPasswordResetCode(email, code, user.getFirstName());
        } catch (Exception ignored) {}
    }

    public void verifyCodeAndResetPassword(String email, String code, String newPassword) {
        String normalizedEmail = normalizeEmail(email);

        PasswordResetToken resetToken = resetTokenRepository
            .findByEmailAndCodeAndUsedFalse(normalizedEmail, code)
                .orElseThrow(() -> new RuntimeException("Code invalide ou expire"));

        if (resetToken.isExpired()) {
            resetTokenRepository.delete(resetToken);
            throw new RuntimeException("Ce code a expire. Veuillez en demander un nouveau.");
        }

        if (newPassword == null) return;

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);
    }
}