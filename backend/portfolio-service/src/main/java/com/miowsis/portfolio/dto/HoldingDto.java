package com.miowsis.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HoldingDto {
    private String id;
    private String symbol;
    private String companyName;
    private BigDecimal shares;
    private BigDecimal avgCost;
    private BigDecimal totalCost;
    private BigDecimal currentPrice;
    private BigDecimal marketValue;
    private BigDecimal gainLoss;
    private BigDecimal gainLossPercent;
    private BigDecimal dayGain;
    private BigDecimal dayGainPercent;
    private BigDecimal portfolioPercent;
    private Integer esgScore;
    private String assetType;
    private String sector;
}