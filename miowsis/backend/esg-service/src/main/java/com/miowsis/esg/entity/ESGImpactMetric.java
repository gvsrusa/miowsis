package com.miowsis.esg.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "esg_impact_metrics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ESGImpactMetric {
    @Id
    private String id;
    
    private String userId;
    private String portfolioId;
    
    private LocalDateTime calculationDate;
    
    // Environmental Impact
    private CarbonFootprint carbonFootprint;
    private RenewableEnergy renewableEnergy;
    private WaterUsage waterUsage;
    
    // Social Impact
    private SocialMetrics socialMetrics;
    
    // Governance Impact
    private GovernanceMetrics governanceMetrics;
    
    // Aggregated Impact
    private BigDecimal totalInvestment;
    private Integer portfolioESGScore;
    private Map<String, Double> sectorAllocation;
    private List<ImpactStory> impactStories;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CarbonFootprint {
        private Double totalCO2Avoided; // in tons
        private Double equivalentTreesPlanted;
        private Double equivalentCarsMilesReduced;
        private Map<String, Double> companyContributions;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RenewableEnergy {
        private Double totalRenewableEnergySupported; // in MWh
        private Double equivalentHomePowered;
        private Map<String, Double> energySourceBreakdown;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WaterUsage {
        private Double totalWaterSaved; // in gallons
        private Double equivalentShowersSkipped;
        private Map<String, Double> companyEfficiency;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SocialMetrics {
        private Integer jobsSupported;
        private Integer communitiesImpacted;
        private Double diversityScore;
        private Double fairWageScore;
        private List<String> socialPrograms;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GovernanceMetrics {
        private Double boardDiversityScore;
        private Double ethicsScore;
        private Double transparencyScore;
        private Integer ethicalViolations;
        private List<String> certifications;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactStory {
        private String company;
        private String title;
        private String description;
        private String category;
        private String imageUrl;
        private LocalDateTime date;
    }
}