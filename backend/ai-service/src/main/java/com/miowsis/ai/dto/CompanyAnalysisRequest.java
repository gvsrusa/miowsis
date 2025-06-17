package com.miowsis.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyAnalysisRequest {
    @NotBlank
    private String symbol;
    
    private String companyName;
    private boolean includeFinancials;
    private boolean includeESG;
    private boolean includeTechnicalAnalysis;
    private String timeFrame; // "1M", "3M", "6M", "1Y"
}