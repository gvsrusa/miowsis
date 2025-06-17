package com.miowsis.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationRequest {
    @NotBlank
    private String portfolioId;
    
    @NotNull
    private Map<String, Double> currentAllocation;
    
    private String optimizationGoal; // "maximize_returns", "minimize_risk", "esg_focused"
    private Double riskTolerance;
    private Integer timeHorizon; // in years
}