package com.miowsis.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String profileImage;
    private boolean emailVerified;
    private String kycStatus;
    private boolean onboardingComplete;
    private boolean biometricEnabled;
    private boolean twoFactorEnabled;
}