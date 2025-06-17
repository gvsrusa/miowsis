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
public class MarketInsights {
    private LocalDateTime timestamp;
    private List<String> sectors;
    private String overallSentiment; // BULLISH, BEARISH, NEUTRAL
    private List<String> keyTrends;
    private List<String> recommendations;
    private Map<String, SectorAnalysis> sectorAnalysis;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectorAnalysis {
        private String sectorName;
        private String sentiment;
        private double performanceYTD;
        private List<String> topPerformers;
        private List<String> risks;
        private List<String> opportunities;
    }
}