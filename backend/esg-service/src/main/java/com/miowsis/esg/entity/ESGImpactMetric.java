package com.miowsis.esg.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "esg_impact_metrics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ESGImpactMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    private String userId;
    private String portfolioId;
    private String metricType;
    private Double value;
    
    private LocalDateTime calculationDate;
    
    // Flattened Environmental Impact fields
    private Double totalCO2Avoided;
    private Double equivalentTreesPlanted;
    private Double equivalentCarsMilesReduced;
    private Double totalRenewableEnergySupported;
    private Double equivalentHomePowered;
    private Double totalWaterSaved;
    private Double equivalentShowersSkipped;
    
    // Flattened Social Impact fields
    private Integer jobsSupported;
    private Integer communitiesImpacted;
    private Double diversityScore;
    private Double fairWageScore;
    
    // Flattened Governance Impact fields
    private Double boardDiversityScore;
    private Double ethicsScore;
    private Double transparencyScore;
    private Integer ethicalViolations;
    
    // Aggregated Impact
    private BigDecimal totalInvestment;
    private Integer portfolioESGScore;
    
    @Column(columnDefinition = "TEXT")
    private String impactDescription;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
}