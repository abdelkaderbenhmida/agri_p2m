package com.agricultural.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@agriconnect.com}")
    private String fromEmail;

    public void sendPasswordResetCode(String toEmail, String code, String firstName) {
        if (mailSender == null) {
            System.out.println("[EmailService] Mail non configuré - Code pour " + toEmail + ": " + code);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("AgriConnect - Code de réinitialisation");
            message.setText(
                "Bonjour " + firstName + ",\n\n" +
                "Votre code de réinitialisation est : " + code + "\n\n" +
                "Ce code expire dans 15 minutes.\n\n" +
                "L'équipe AgriConnect"
            );
            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("[EmailService] Erreur envoi email: " + e.getMessage());
            System.out.println("[EmailService] Code de reset pour " + toEmail + ": " + code);
        }
    }
}
