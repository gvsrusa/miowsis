package com.miowsis.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalAdvice {
    private String goalType;
    private BigDecimal targetAmount;
    private BigDecimal recommendedMonthlyContribution;
    private String timeToGoal;
    private List<String> strategies;
    private List<InvestmentRecommendation> investmentRecommendations;
    private String riskAssessment;
    private double probabilityOfSuccess;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvestmentRecommendation {
        private String assetClass;
        private double allocationPercentage;
        private String rationale;
        private List<String> suggestedInstruments;
    }
}