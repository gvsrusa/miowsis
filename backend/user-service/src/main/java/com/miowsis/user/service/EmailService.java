package com.miowsis.user.service;

import com.miowsis.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    @Value("${miowsis.email.kafka.enabled:true}")
    private boolean kafkaEnabled;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    @Value("${app.email.from:noreply@miowsis.com}")
    private String fromEmail;
    
    @Async
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
        // For now, just send to Kafka if enabled
        if (kafkaEnabled) {
            try {
                kafkaTemplate.send("email-events", "send-email", emailData);
                log.info("Verification email sent to Kafka for: {}", user.getEmail());
            } catch (Exception e) {
                log.warn("Failed to send email to Kafka for user: {}. Error: {}", user.getEmail(), e.getMessage());
                // Fallback: Log email for manual processing or direct email service
                log.info("Email fallback - Verification email for: {} with token: {}", user.getEmail(), verificationToken);
            }
        } else {
            log.info("Kafka disabled - Verification email simulated for: {} with token: {}", user.getEmail(), verificationToken);
        }
    }
    
    @Async
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
        
        if (kafkaEnabled) {
            try {
                kafkaTemplate.send("email-events", "send-email", emailData);
                log.info("Password reset email sent to Kafka for: {}", user.getEmail());
            } catch (Exception e) {
                log.warn("Failed to send password reset email to Kafka for user: {}. Error: {}", user.getEmail(), e.getMessage());
                log.info("Email fallback - Password reset email for: {} with reset link: {}", user.getEmail(), resetLink);
            }
        } else {
            log.info("Kafka disabled - Password reset email simulated for: {} with reset link: {}", user.getEmail(), resetLink);
        }
    }
    
    @Async
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
        
        if (kafkaEnabled) {
            try {
                kafkaTemplate.send("email-events", "send-email", emailData);
                log.info("Welcome email sent to Kafka for: {}", user.getEmail());
            } catch (Exception e) {
                log.warn("Failed to send welcome email to Kafka for user: {}. Error: {}", user.getEmail(), e.getMessage());
                log.info("Email fallback - Welcome email for: {} with dashboard link: {}", user.getEmail(), frontendUrl + "/dashboard");
            }
        } else {
            log.info("Kafka disabled - Welcome email simulated for: {} with dashboard link: {}", user.getEmail(), frontendUrl + "/dashboard");
        }
    }
}