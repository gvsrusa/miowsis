package com.miowsis.user.controller;

import com.miowsis.user.dto.UserDto;
import com.miowsis.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User management endpoints")
public class UserController {
    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserDto> getProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getUserProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile")
    public ResponseEntity<UserDto> updateProfile(
            Authentication authentication,
            @RequestBody UserDto userDto) {
        return ResponseEntity.ok(userService.updateUserProfile(authentication.getName(), userDto));
    }

    @PostMapping("/complete-onboarding")
    @Operation(summary = "Mark onboarding as complete")
    public ResponseEntity<UserDto> completeOnboarding(Authentication authentication) {
        return ResponseEntity.ok(userService.completeOnboarding(authentication.getName()));
    }
}