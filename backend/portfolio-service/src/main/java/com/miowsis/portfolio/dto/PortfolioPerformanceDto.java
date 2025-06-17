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
public class PortfolioPerformanceDto {
    private String userId;
    private String period;
    private BigDecimal totalReturn;
    private BigDecimal annualizedReturn;
    private BigDecimal volatility;
    private BigDecimal sharpeRatio;
    private BigDecimal maxDrawdown;
    private BigDecimal alpha;
    private BigDecimal beta;
    private List<PerformanceDataPoint> performanceHistory;
    private LocalDateTime calculatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerformanceDataPoint {
        private LocalDateTime date;
        private BigDecimal portfolioValue;
        private BigDecimal benchmarkValue;
        private BigDecimal returnPercent;
    }
}