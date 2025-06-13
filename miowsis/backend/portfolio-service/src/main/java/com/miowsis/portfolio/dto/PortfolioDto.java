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
public class PortfolioDto {
    private String id;
    private String userId;
    private String portfolioName;
    private String portfolioType;
    private BigDecimal totalValue;
    private BigDecimal totalCost;
    private BigDecimal totalGain;
    private BigDecimal totalGainPercent;
    private BigDecimal dayGain;
    private BigDecimal dayGainPercent;
    private BigDecimal cashBalance;
    private Integer esgScore;
    private Integer environmentalScore;
    private Integer socialScore;
    private Integer governanceScore;
    private List<HoldingDto> holdings;
    private LocalDateTime lastUpdated;
}