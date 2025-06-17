package com.miowsis.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyAnalysis {
    private String symbol;
    private String companyName;
    private LocalDateTime analysisDate;
    private String fundamentalAnalysis;
    private String technicalAnalysis;
    private String esgAnalysis;
    private String recommendation; // BUY, HOLD, SELL
    private double targetPrice;
    private double currentPrice;
    private Map<String, Double> financialMetrics;
    private Map<String, String> risks;
    private Map<String, String> opportunities;
}