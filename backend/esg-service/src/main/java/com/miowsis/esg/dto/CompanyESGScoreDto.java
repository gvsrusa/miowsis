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
public class CompanyESGScoreDto {
    private String id;
    private String symbol;
    private String companyName;
    private int environmentalScore;
    private int socialScore;
    private int governanceScore;
    private int overallScore;
    private String rating; // AAA, AA, A, BBB, BB, B, CCC
    private double carbonFootprint;
    private double renewableEnergyUsage;
    private int diversityScore;
    private LocalDateTime lastUpdated;
}