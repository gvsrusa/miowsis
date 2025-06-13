package com.miowsis.user.service;

import com.miowsis.user.dto.AuthResponse;
import com.miowsis.user.dto.LoginRequest;
import com.miowsis.user.dto.RegisterRequest;
import com.miowsis.user.entity.User;
import com.miowsis.user.exception.AuthenticationException;
import com.miowsis.user.exception.UserAlreadyExistsException;
import com.miowsis.user.mapper.UserMapper;
import com.miowsis.user.repository.UserRepository;
import com.miowsis.user.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("User with email already exists");
        }

        // Create new user
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .roles(Set.of(User.Role.USER))
                .emailVerified(false)
                .kycStatus(User.KycStatus.PENDING)
                .onboardingComplete(false)
                .biometricEnabled(false)
                .twoFactorEnabled(false)
                .accountLocked(false)
                .failedLoginAttempts(0)
                .build();

        user = userRepository.save(user);

        // Send verification email
        emailService.sendVerificationEmail(user);

        // Publish user created event
        kafkaTemplate.send("user-events", "user.created", 
            Map.of("userId", user.getId(), "email", user.getEmail()));

        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toDto(user))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = (User) authentication.getPrincipal();

            // Reset failed login attempts
            user.setFailedLoginAttempts(0);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Generate tokens
            String accessToken = jwtTokenProvider.generateAccessToken(user);
            String refreshToken = jwtTokenProvider.generateRefreshToken(user);

            // Publish login event
            kafkaTemplate.send("user-events", "user.login", 
                Map.of("userId", user.getId(), "timestamp", LocalDateTime.now()));

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .user(userMapper.toDto(user))
                    .build();
        } catch (BadCredentialsException e) {
            handleFailedLogin(request.getEmail());
            throw new AuthenticationException("Invalid credentials");
        }
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new AuthenticationException("Invalid refresh token");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        String newAccessToken = jwtTokenProvider.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toDto(user))
                .build();
    }

    public void logout(String token) {
        // Add token to blacklist (implement Redis-based blacklist)
        // For now, just publish logout event
        String email = jwtTokenProvider.getEmailFromToken(token);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            kafkaTemplate.send("user-events", "user.logout", 
                Map.of("userId", user.getId(), "timestamp", LocalDateTime.now()));
        }
    }

    public AuthResponse verifyToken(String token) {
        if (!jwtTokenProvider.validateToken(token)) {
            throw new AuthenticationException("Invalid token");
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        return AuthResponse.builder()
                .accessToken(token)
                .user(userMapper.toDto(user))
                .build();
    }

    @Transactional
    public void verifyEmail(String token) {
        // Implement email verification logic
        // This would validate the token and update user.emailVerified = true
    }

    @Transactional
    public void initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        // Generate reset token and send email
        String resetToken = UUID.randomUUID().toString();
        // Store token in cache/database with expiration
        emailService.sendPasswordResetEmail(user, resetToken);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Validate reset token and update password
        // Implementation depends on how reset tokens are stored
    }

    private void handleFailedLogin(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= 5) {
                user.setAccountLocked(true);
                kafkaTemplate.send("user-events", "user.locked", 
                    Map.of("userId", user.getId(), "reason", "Too many failed login attempts"));
            }
            userRepository.save(user);
        });
    }
}