package com.miowsis.portfolio.dto;

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
public class RebalanceRequest {
    private String strategy;
    private List<AllocationTarget> allocationTargets;
    private BigDecimal tolerancePercent;
    private boolean dryRun;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllocationTarget {
        private String symbol;
        private BigDecimal targetPercent;
        private BigDecimal minPercent;
        private BigDecimal maxPercent;
    }
}