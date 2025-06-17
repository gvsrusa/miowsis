package com.miowsis.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioRecommendation {
    private String userId;
    private String riskProfile;
    private String recommendations;
    private List<StockRecommendation> stockRecommendations;
    private LocalDateTime generatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockRecommendation {
        private String symbol;
        private String companyName;
        private String action; // BUY, HOLD, SELL
        private double targetAllocation;
        private String rationale;
    }
}