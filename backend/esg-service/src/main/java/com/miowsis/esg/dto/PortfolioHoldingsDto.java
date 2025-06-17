package com.miowsis.esg.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioHoldingsDto {
    private String portfolioId;
    private String userId;
    private List<HoldingDto> holdings;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HoldingDto {
        private String symbol;
        private String companyName;
        private double shares;
        private double currentValue;
        private double weight; // percentage of portfolio
    }
}