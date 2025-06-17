package com.miowsis.esg.service;

import com.miowsis.esg.dto.*;
import com.miowsis.esg.entity.CompanyESGScore;
import com.miowsis.esg.entity.ESGImpactMetric;
import com.miowsis.esg.repository.CompanyESGScoreRepository;
import com.miowsis.esg.repository.ESGImpactMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ESGScoringService {
    
    private final CompanyESGScoreRepository companyESGScoreRepository;
    private final ESGImpactMetricRepository impactMetricRepository;
    private final ESGDataProviderService dataProviderService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    private static final Map<String, Double> SECTOR_WEIGHTS = Map.of(
        "TECHNOLOGY", 1.0,
        "RENEWABLE_ENERGY", 1.2,
        "HEALTHCARE", 1.1,
        "FINANCIAL", 0.9,
        "ENERGY", 0.7,
        "UTILITIES", 0.8
    );
    
    @Cacheable(value = "companyESGScores", key = "#symbol")
    public CompanyESGScoreDto getCompanyESGScore(String symbol) {
        CompanyESGScore score = companyESGScoreRepository.findBySymbol(symbol)
                .orElseGet(() -> fetchAndSaveESGScore(symbol));
        
        return mapToDto(score);
    }
    
    public PortfolioESGScoreDto calculatePortfolioESGScore(PortfolioHoldingsDto portfolio) {
        List<WeightedESGScore> weightedScores = new ArrayList<>();
        // Calculate total portfolio value
        double totalValue = portfolio.getHoldings().stream()
                .mapToDouble(h -> h.getCurrentValue())
                .sum();
        
        for (PortfolioHoldingsDto.HoldingDto holding : portfolio.getHoldings()) {
            CompanyESGScoreDto companyScore = getCompanyESGScore(holding.getSymbol());
            double weight = holding.getCurrentValue() / totalValue;
            
            weightedScores.add(WeightedESGScore.builder()
                    .symbol(holding.getSymbol())
                    .weight(weight)
                    .score(companyScore.getOverallScore())
                    .build());
        }
        
        // Calculate weighted average scores
        int overallScore = calculateWeightedScore(weightedScores, "overall");
        int environmentalScore = calculateWeightedScore(weightedScores, "environmental");
        int socialScore = calculateWeightedScore(weightedScores, "social");
        int governanceScore = calculateWeightedScore(weightedScores, "governance");
        
        // Determine trend
        // Analyze portfolio trend (simplified)
        String rating = determineRating(overallScore);
        
        // Calculate impact metrics
        ESGImpactSummaryDto impactSummary = calculateImpactMetrics(portfolio);
        
        return PortfolioESGScoreDto.builder()
                .portfolioId(portfolio.getPortfolioId())
                .overallScore(overallScore)
                .environmentalScore(environmentalScore)
                .socialScore(socialScore)
                .governanceScore(governanceScore)
                .rating(rating)
                .improvements(generateImprovements(weightedScores))
                .impactSummary(impactSummary)
                .calculatedAt(LocalDateTime.now())
                .build();
    }
    
    public ESGImpactReportDto generateImpactReport(String userId, String period) {
        ESGImpactMetric latestMetric = impactMetricRepository
                .findByUserId(userId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No impact metrics found"));
        
        return ESGImpactReportDto.builder()
                .userId(userId)
                .period(period)
                .reportDate(LocalDateTime.now())
                .currentImpact(calculateImpactMetrics(null)) // TODO: Pass real portfolio
                .totalPositiveImpact(100.0) // TODO: Calculate real impact
                .build();
    }
    
    public List<ESGScreeningResultDto> screenCompanies(ESGScreeningCriteriaDto criteria) {
        List<CompanyESGScore> allCompanies = companyESGScoreRepository.findAll();
        
        return allCompanies.stream()
                .filter(company -> meetsScreeningCriteria(company, criteria))
                .map(this::mapToDto)
                .map(dto -> ESGScreeningResultDto.builder()
                        .symbol(dto.getSymbol())
                        .companyName(dto.getCompanyName())
                        .overallScore(dto.getOverallScore())
                        .environmentalScore(dto.getEnvironmentalScore())
                        .socialScore(dto.getSocialScore())
                        .governanceScore(dto.getGovernanceScore())
                        .rating(dto.getRating())
                        .meetsAllCriteria(true)
                        .build())
                .sorted(Comparator.comparing(ESGScreeningResultDto::getOverallScore).reversed())
                .limit(50)
                .collect(Collectors.toList());
    }
    
    private CompanyESGScore fetchAndSaveESGScore(String symbol) {
        // Fetch from external data provider
        ESGDataDto externalData = dataProviderService.fetchESGData(symbol);
        
        CompanyESGScore score = CompanyESGScore.builder()
                .symbol(symbol)
                .companyName(externalData.getCompanyName())
                .overallScore(calculateOverallScore(externalData))
                .environmentalScore(externalData.getEnvironmentalScore())
                .socialScore(externalData.getSocialScore())
                .governanceScore(externalData.getGovernanceScore())
                .carbonEmissions(externalData.getCarbonEmissions())
                .renewableEnergyUsage(externalData.getRenewableEnergyUsage())
                .waterUsage(externalData.getWaterUsage())
                .employeeSatisfaction((double) externalData.getEmployeeSatisfaction())
                .genderDiversity((double) externalData.getDiversityScore())
                .boardDiversity((double) externalData.getBoardDiversity())
                .sector("Technology") // TODO: Get from external data
                .industry("Software")
                .trend(determineTrend(symbol))
                .lastUpdated(LocalDate.now())
                .dataSource(externalData.getDataProvider())
                .build();
        
        return companyESGScoreRepository.save(score);
    }
    
    private int calculateOverallScore(ESGDataDto data) {
        // Weighted average: E=40%, S=30%, G=30%
        return (int) Math.round(
                data.getEnvironmentalScore() * 0.4 +
                data.getSocialScore() * 0.3 +
                data.getGovernanceScore() * 0.3
        );
    }
    
    private int calculateWeightedScore(List<WeightedESGScore> scores, String scoreType) {
        double totalWeight = 0.0;
        double weightedSum = 0.0;
        
        for (WeightedESGScore score : scores) {
            int scoreValue = score.getScore();
            
            weightedSum += scoreValue * score.getWeight();
            totalWeight += score.getWeight();
        }
        
        return totalWeight > 0 ? (int) Math.round(weightedSum / totalWeight) : 0;
    }
    
    private ESGImpactSummaryDto calculateImpactMetrics(PortfolioHoldingsDto portfolio) {
        double totalCO2Avoided = 0;
        double renewableEnergySupported = 0;
        int jobsSupported = 0;
        
        for (PortfolioHoldingsDto.HoldingDto holding : portfolio.getHoldings()) {
            CompanyESGScore company = companyESGScoreRepository.findBySymbol(holding.getSymbol()).orElse(null);
            if (company != null) {
                // Calculate proportional impact based on investment
                double investmentRatio = holding.getCurrentValue() / 1000000; // Per million invested
                
                totalCO2Avoided += (100 - company.getCarbonEmissions()) * investmentRatio;
                renewableEnergySupported += company.getRenewableEnergyUsage() * investmentRatio;
                jobsSupported += (int) (company.getEmployeeSatisfaction() * investmentRatio);
            }
        }
        
        return ESGImpactSummaryDto.builder()
                .totalCarbonFootprint(totalCO2Avoided)
                .averageRenewableEnergyUsage(renewableEnergySupported)
                .averageDiversityScore(80) // TODO: Calculate real diversity score
                .companiesWithHighESG(5) // TODO: Count real companies
                .companiesWithLowESG(1) // TODO: Count real companies
                .portfolioAlignment(0.85) // TODO: Calculate real alignment
                .build();
    }
    
    private boolean meetsScreeningCriteria(CompanyESGScore company, ESGScreeningCriteriaDto criteria) {
        if (criteria.getMinOverallScore() != null && company.getOverallScore() < criteria.getMinOverallScore()) {
            return false;
        }
        
        if (criteria.getMinEnvironmentalScore() != null && company.getEnvironmentalScore() < criteria.getMinEnvironmentalScore()) {
            return false;
        }
        
        if (criteria.getMinSocialScore() != null && company.getSocialScore() < criteria.getMinSocialScore()) {
            return false;
        }
        
        if (criteria.getMinGovernanceScore() != null && company.getGovernanceScore() < criteria.getMinGovernanceScore()) {
            return false;
        }
        
        if (criteria.getExcludeSectors() != null && criteria.getExcludeSectors().contains(company.getSector())) {
            return false;
        }
        
        if (criteria.getIncludeOnly() != null && !criteria.getIncludeOnly().isEmpty() 
                && !criteria.getIncludeOnly().contains(company.getSector())) {
            return false;
        }
        
        return true;
    }
    
    private CompanyESGScoreDto mapToDto(CompanyESGScore entity) {
        return CompanyESGScoreDto.builder()
                .symbol(entity.getSymbol())
                .companyName(entity.getCompanyName())
                .overallScore(entity.getOverallScore())
                .environmentalScore(entity.getEnvironmentalScore())
                .socialScore(entity.getSocialScore())
                .governanceScore(entity.getGovernanceScore())
                .rating(determineRating(entity.getOverallScore()))
                .carbonFootprint(entity.getCarbonEmissions())
                .renewableEnergyUsage(entity.getRenewableEnergyUsage())
                .diversityScore(entity.getGenderDiversity() != null ? entity.getGenderDiversity().intValue() : 0)
                .lastUpdated(entity.getLastUpdated() != null ? entity.getLastUpdated().atStartOfDay() : LocalDateTime.now())
                .build();
    }
    
    private String determineRating(int score) {
        if (score >= 90) return "AAA";
        if (score >= 80) return "AA";
        if (score >= 70) return "A";
        if (score >= 60) return "BBB";
        if (score >= 50) return "BB";
        if (score >= 40) return "B";
        return "CCC";
    }
    
    private CompanyESGScore.ScoreTrend determineTrend(String symbol) {
        // Simple implementation - in real scenario, would compare with historical data
        return CompanyESGScore.ScoreTrend.STABLE;
    }
    
    private List<String> generateImprovements(List<WeightedESGScore> scores) {
        List<String> improvements = new ArrayList<>();
        
        // Find lowest scoring areas
        scores.stream()
                .filter(s -> s.getScore() < 70)
                .forEach(s -> improvements.add("Consider replacing " + s.getSymbol() + " with higher ESG-rated alternatives"));
        
        if (improvements.isEmpty()) {
            improvements.add("Your portfolio has strong ESG scores across all holdings");
        }
        
        return improvements;
    }
}