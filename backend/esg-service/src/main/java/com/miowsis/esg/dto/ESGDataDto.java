package com.miowsis.esg.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ESGDataDto {
    private String symbol;
    private String companyName;
    private int environmentalScore;
    private int socialScore;
    private int governanceScore;
    private int overallScore;
    
    // Environmental metrics
    private double carbonEmissions;
    private double renewableEnergyUsage;
    private double waterUsage;
    private double wasteRecycled;
    
    // Social metrics
    private int diversityScore;
    private int employeeSatisfaction;
    private int communityEngagement;
    
    // Governance metrics
    private int boardDiversity;
    private double executiveCompensationRatio;
    private int ethicsViolations;
    
    private LocalDateTime lastUpdated;
    private String dataProvider;
}