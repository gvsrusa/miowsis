package com.miowsis.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationSuggestion {
    private String portfolioId;
    private Map<String, Double> currentAllocation;
    private String suggestedAllocation;
    private double estimatedImprovement;
    private List<RebalanceAction> actions;
    private String rationale;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RebalanceAction {
        private String symbol;
        private String action; // BUY, SELL
        private double quantity;
        private double currentWeight;
        private double targetWeight;
    }
}