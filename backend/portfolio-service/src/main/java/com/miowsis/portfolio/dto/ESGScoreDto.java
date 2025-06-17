package com.miowsis.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ESGScoreDto {
    private Integer overallScore;
    private Integer environmentalScore;
    private Integer socialScore;
    private Integer governanceScore;
    private String rating;
    private BigDecimal controversyScore;
    private String methodology;
    private LocalDateTime lastUpdated;
    private String dataProvider;
}