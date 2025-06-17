package com.miowsis.ai.dto;

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
public class ESGTrendsAnalysis {
    private LocalDateTime timestamp;
    private List<String> topESGCompanies;
    private List<String> emergingTrends;
    private List<String> regulatoryUpdates;
    private Map<String, IndustryESGInsight> industryInsights;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndustryESGInsight {
        private String industry;
        private double averageESGScore;
        private String trend; // IMPROVING, STABLE, DECLINING
        private List<String> keyInitiatives;
        private List<String> challenges;
    }
}