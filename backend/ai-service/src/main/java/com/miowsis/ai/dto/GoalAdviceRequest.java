package com.miowsis.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalAdviceRequest {
    @NotBlank
    private String goalType; // "retirement", "house", "education", "vacation", "emergency"
    
    @NotNull
    @Min(0)
    private BigDecimal targetAmount;
    
    @NotNull
    @Min(1)
    private Integer timeHorizonYears;
    
    private BigDecimal currentSavings;
    private BigDecimal monthlyContribution;
    private String riskTolerance; // "conservative", "moderate", "aggressive"
}