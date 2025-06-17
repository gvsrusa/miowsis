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
public class ESGImpactReportDto {
    private String userId;
    private String period;
    private LocalDateTime reportDate;
    private ESGImpactSummaryDto currentImpact;
    private Map<String, Double> impactTrends;
    private List<ImpactAchievement> achievements;
    private List<ImpactImprovement> recommendations;
    private double totalPositiveImpact;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactAchievement {
        private String title;
        private String description;
        private String category; // environmental, social, governance
        private LocalDateTime achievedDate;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactImprovement {
        private String area;
        private String suggestion;
        private double potentialImprovement;
        private String difficulty; // easy, medium, hard
    }
}