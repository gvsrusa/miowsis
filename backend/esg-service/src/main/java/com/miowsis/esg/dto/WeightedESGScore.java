package com.miowsis.esg.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeightedESGScore {
    private String symbol;
    private String companyName;
    private double weight;
    private int score;
    private double weightedScore;
}