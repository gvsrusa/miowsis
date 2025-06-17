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
public class PortfolioAllocationDto {
    private String portfolioId;
    private String userId;
    private BigDecimal totalValue;
    private List<AssetAllocation> assetAllocations;
    private List<SectorAllocation> sectorAllocations;
    private List<GeographicAllocation> geographicAllocations;
    private CashAllocation cashAllocation;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetAllocation {
        private String assetType;
        private BigDecimal value;
        private BigDecimal percentage;
        private int holdingsCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectorAllocation {
        private String sector;
        private BigDecimal value;
        private BigDecimal percentage;
        private int holdingsCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeographicAllocation {
        private String region;
        private BigDecimal value;
        private BigDecimal percentage;
        private int holdingsCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CashAllocation {
        private BigDecimal value;
        private BigDecimal percentage;
    }
}