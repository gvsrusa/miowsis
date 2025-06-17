package com.miowsis.esg.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ESGScreeningCriteriaDto {
    private Integer minEnvironmentalScore;
    private Integer minSocialScore;
    private Integer minGovernanceScore;
    private Integer minOverallScore;
    private List<String> excludeSectors;
    private List<String> includeOnly;
    private Boolean excludeControversial;
    private Double maxCarbonFootprint;
    private Integer minDiversityScore;
}