package com.miowsis.esg.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ESGScreeningResultDto {
    private String symbol;
    private String companyName;
    private int overallScore;
    private int environmentalScore;
    private int socialScore;
    private int governanceScore;
    private String rating;
    private boolean meetsAllCriteria;
    private String primarySector;
}