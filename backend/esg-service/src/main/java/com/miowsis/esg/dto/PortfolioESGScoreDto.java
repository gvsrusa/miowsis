package com.miowsis.esg.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioESGScoreDto {
    private String portfolioId;
    private int overallScore;
    private int environmentalScore;
    private int socialScore;
    private int governanceScore;
    private String rating;
    private Map<String, CompanyESGContribution> companyContributions;
    private ESGImpactSummaryDto impactSummary;
    private List<String> improvements;
    private LocalDateTime calculatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyESGContribution {
        private String symbol;
        private String companyName;
        private double weight;
        private int esgScore;
        private double contribution;
    }
}