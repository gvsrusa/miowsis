package com.miowsis.portfolio.service;

import com.miowsis.portfolio.dto.ESGScoreDto;
import com.miowsis.portfolio.entity.Portfolio;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class ESGScoringService {
    
    // Mock ESG scores for testing purposes
    private final Map<String, ESGScoreDto> mockESGScores = new HashMap<>();
    
    public ESGScoringService() {
        // Initialize with some mock ESG data
        mockESGScores.put("AAPL", ESGScoreDto.builder()
                .overallScore(85)
                .environmentalScore(90)
                .socialScore(80)
                .governanceScore(85)
                .rating("A")
                .controversyScore(BigDecimal.valueOf(2.1))
                .methodology("MSCI ESG")
                .dataProvider("Mock Provider")
                .lastUpdated(LocalDateTime.now())
                .build());
                
        mockESGScores.put("GOOGL", ESGScoreDto.builder()
                .overallScore(78)
                .environmentalScore(85)
                .socialScore(70)
                .governanceScore(80)
                .rating("A-")
                .controversyScore(BigDecimal.valueOf(3.2))
                .methodology("MSCI ESG")
                .dataProvider("Mock Provider")
                .lastUpdated(LocalDateTime.now())
                .build());
                
        mockESGScores.put("TSLA", ESGScoreDto.builder()
                .overallScore(92)
                .environmentalScore(95)
                .socialScore(88)
                .governanceScore(90)
                .rating("A+")
                .controversyScore(BigDecimal.valueOf(1.5))
                .methodology("MSCI ESG")
                .dataProvider("Mock Provider")
                .lastUpdated(LocalDateTime.now())
                .build());
    }
    
    public ESGScoreDto getESGScore(String symbol) {
        log.info("Fetching ESG score for symbol: {}", symbol);
        
        // In a real implementation, this would call an external ESG data API
        ESGScoreDto score = mockESGScores.getOrDefault(symbol, createDefaultESGScore());
        
        log.debug("ESG score for {} is {}", symbol, score.getOverallScore());
        return score;
    }
    
    public ESGScoreDto calculatePortfolioESGScore(Portfolio portfolio) {
        log.info("Calculating portfolio ESG score for portfolio: {}", portfolio.getId());
        
        if (portfolio.getHoldings() == null || portfolio.getHoldings().isEmpty()) {
            return createDefaultESGScore();
        }
        
        // Calculate weighted average ESG scores based on portfolio holdings
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal weightedEnvironmental = BigDecimal.ZERO;
        BigDecimal weightedSocial = BigDecimal.ZERO;
        BigDecimal weightedGovernance = BigDecimal.ZERO;
        BigDecimal weightedOverall = BigDecimal.ZERO;
        
        for (var holding : portfolio.getHoldings()) {
            ESGScoreDto holdingESG = getESGScore(holding.getSymbol());
            BigDecimal weight = holding.getMarketValue() != null ? holding.getMarketValue() : BigDecimal.ZERO;
            
            if (weight.compareTo(BigDecimal.ZERO) > 0) {
                totalWeight = totalWeight.add(weight);
                weightedEnvironmental = weightedEnvironmental.add(
                    weight.multiply(BigDecimal.valueOf(holdingESG.getEnvironmentalScore())));
                weightedSocial = weightedSocial.add(
                    weight.multiply(BigDecimal.valueOf(holdingESG.getSocialScore())));
                weightedGovernance = weightedGovernance.add(
                    weight.multiply(BigDecimal.valueOf(holdingESG.getGovernanceScore())));
                weightedOverall = weightedOverall.add(
                    weight.multiply(BigDecimal.valueOf(holdingESG.getOverallScore())));
            }
        }
        
        if (totalWeight.compareTo(BigDecimal.ZERO) == 0) {
            return createDefaultESGScore();
        }
        
        int avgEnvironmental = weightedEnvironmental.divide(totalWeight, 0, BigDecimal.ROUND_HALF_UP).intValue();
        int avgSocial = weightedSocial.divide(totalWeight, 0, BigDecimal.ROUND_HALF_UP).intValue();
        int avgGovernance = weightedGovernance.divide(totalWeight, 0, BigDecimal.ROUND_HALF_UP).intValue();
        int avgOverall = weightedOverall.divide(totalWeight, 0, BigDecimal.ROUND_HALF_UP).intValue();
        
        return ESGScoreDto.builder()
                .overallScore(avgOverall)
                .environmentalScore(avgEnvironmental)
                .socialScore(avgSocial)
                .governanceScore(avgGovernance)
                .rating(getRatingFromScore(avgOverall))
                .controversyScore(BigDecimal.valueOf(2.5))
                .methodology("Portfolio Weighted Average")
                .dataProvider("Mock Provider")
                .lastUpdated(LocalDateTime.now())
                .build();
    }
    
    private ESGScoreDto createDefaultESGScore() {
        return ESGScoreDto.builder()
                .overallScore(50)
                .environmentalScore(50)
                .socialScore(50)
                .governanceScore(50)
                .rating("C")
                .controversyScore(BigDecimal.valueOf(5.0))
                .methodology("Default")
                .dataProvider("Mock Provider")
                .lastUpdated(LocalDateTime.now())
                .build();
    }
    
    private String getRatingFromScore(int score) {
        if (score >= 90) return "A+";
        if (score >= 80) return "A";
        if (score >= 70) return "A-";
        if (score >= 60) return "B";
        if (score >= 50) return "C";
        return "D";
    }
}