package com.miowsis.esg.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ESGImpactSummaryDto {
    private double totalCarbonFootprint;
    private double averageRenewableEnergyUsage;
    private int averageDiversityScore;
    private int companiesWithHighESG;
    private int companiesWithLowESG;
    private double portfolioAlignment; // alignment with ESG goals
}