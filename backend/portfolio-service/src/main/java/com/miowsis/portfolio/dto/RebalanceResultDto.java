package com.miowsis.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RebalanceResultDto {
    private String portfolioId;
    private String strategy;
    private List<RebalanceAction> actions;
    private BigDecimal totalCost;
    private BigDecimal totalFees;
    private String status;
    private LocalDateTime executedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RebalanceAction {
        private String symbol;
        private String action; // BUY or SELL
        private BigDecimal shares;
        private BigDecimal estimatedPrice;
        private BigDecimal estimatedAmount;
        private String reason;
    }
}