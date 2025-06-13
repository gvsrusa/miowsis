package com.miowsis.user.service;

import com.miowsis.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    @Value("${app.email.from:noreply@miowsis.com}")
    private String fromEmail;
    
    public void sendVerificationEmail(User user) {
        String verificationToken = UUID.randomUUID().toString();
        String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
        
        Map<String, Object> emailData = new HashMap<>();
        emailData.put("to", user.getEmail());
        emailData.put("from", fromEmail);
        emailData.put("subject", "Welcome to MIOwSIS - Verify Your Email");
        emailData.put("template", "email-verification");
        emailData.put("data", Map.of(
            "firstName", user.getFirstName(),
            "verificationLink", verificationLink
        ));
        
        // Store token in cache/database for verification
        // For now, just send to Kafka
        kafkaTemplate.send("email-events", "send-email", emailData);
        
        log.info("Verification email sent to: {}", user.getEmail());
    }
    
    public void sendPasswordResetEmail(User user, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        
        Map<String, Object> emailData = new HashMap<>();
        emailData.put("to", user.getEmail());
        emailData.put("from", fromEmail);
        emailData.put("subject", "MIOwSIS - Password Reset Request");
        emailData.put("template", "password-reset");
        emailData.put("data", Map.of(
            "firstName", user.getFirstName(),
            "resetLink", resetLink
        ));
        
        kafkaTemplate.send("email-events", "send-email", emailData);
        
        log.info("Password reset email sent to: {}", user.getEmail());
    }
    
    public void sendWelcomeEmail(User user) {
        Map<String, Object> emailData = new HashMap<>();
        emailData.put("to", user.getEmail());
        emailData.put("from", fromEmail);
        emailData.put("subject", "Welcome to MIOwSIS!");
        emailData.put("template", "welcome");
        emailData.put("data", Map.of(
            "firstName", user.getFirstName(),
            "dashboardLink", frontendUrl + "/dashboard"
        ));
        
        kafkaTemplate.send("email-events", "send-email", emailData);
        
        log.info("Welcome email sent to: {}", user.getEmail());
    }
}