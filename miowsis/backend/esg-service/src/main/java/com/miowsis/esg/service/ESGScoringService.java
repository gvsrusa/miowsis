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
import java.math.RoundingMode;
import java.time.LocalDateTime;
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
        BigDecimal totalValue = portfolio.getTotalValue();
        
        for (HoldingDto holding : portfolio.getHoldings()) {
            CompanyESGScoreDto companyScore = getCompanyESGScore(holding.getSymbol());
            BigDecimal weight = holding.getMarketValue().divide(totalValue, 4, RoundingMode.HALF_UP);
            
            weightedScores.add(WeightedESGScore.builder()
                    .symbol(holding.getSymbol())
                    .weight(weight)
                    .overallScore(companyScore.getOverallScore())
                    .environmentalScore(companyScore.getEnvironmentalScore())
                    .socialScore(companyScore.getSocialScore())
                    .governanceScore(companyScore.getGovernanceScore())
                    .build());
        }
        
        // Calculate weighted average scores
        int overallScore = calculateWeightedScore(weightedScores, "overall");
        int environmentalScore = calculateWeightedScore(weightedScores, "environmental");
        int socialScore = calculateWeightedScore(weightedScores, "social");
        int governanceScore = calculateWeightedScore(weightedScores, "governance");
        
        // Determine trend
        String trend = analyzePortfolioTrend(portfolio.getUserId());
        
        // Calculate impact metrics
        ESGImpactSummaryDto impactSummary = calculateImpactMetrics(portfolio);
        
        return PortfolioESGScoreDto.builder()
                .userId(portfolio.getUserId())
                .overallScore(overallScore)
                .environmentalScore(environmentalScore)
                .socialScore(socialScore)
                .governanceScore(governanceScore)
                .trend(trend)
                .topPerformers(getTopESGPerformers(weightedScores, 3))
                .bottomPerformers(getBottomESGPerformers(weightedScores, 3))
                .sectorBreakdown(calculateSectorBreakdown(portfolio))
                .impactSummary(impactSummary)
                .lastUpdated(LocalDateTime.now())
                .build();
    }
    
    public ESGImpactReportDto generateImpactReport(String userId, String period) {
        ESGImpactMetric latestMetric = impactMetricRepository
                .findTopByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new IllegalArgumentException("No impact metrics found"));
        
        return ESGImpactReportDto.builder()
                .userId(userId)
                .reportPeriod(period)
                .carbonFootprint(mapCarbonFootprint(latestMetric.getCarbonFootprint()))
                .renewableEnergy(mapRenewableEnergy(latestMetric.getRenewableEnergy()))
                .socialImpact(mapSocialImpact(latestMetric.getSocialMetrics()))
                .governanceMetrics(mapGovernanceMetrics(latestMetric.getGovernanceMetrics()))
                .impactStories(mapImpactStories(latestMetric.getImpactStories()))
                .generatedAt(LocalDateTime.now())
                .build();
    }
    
    public List<ESGScreeningResultDto> screenCompanies(ESGScreeningCriteriaDto criteria) {
        List<CompanyESGScore> allCompanies = companyESGScoreRepository.findAll();
        
        return allCompanies.stream()
                .filter(company -> meetsScreeningCriteria(company, criteria))
                .map(this::mapToScreeningResult)
                .sorted(Comparator.comparing(ESGScreeningResultDto::getOverallScore).reversed())
                .limit(criteria.getMaxResults() != null ? criteria.getMaxResults() : 50)
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
                .employeeSatisfaction(externalData.getEmployeeSatisfaction())
                .genderDiversity(externalData.getGenderDiversity())
                .boardDiversity(externalData.getBoardDiversity())
                .sector(externalData.getSector())
                .industry(externalData.getIndustry())
                .trend(determineTrend(symbol))
                .lastUpdated(LocalDateTime.now().toLocalDate())
                .dataSource(externalData.getSource())
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
        double weightedSum = 0;
        BigDecimal totalWeight = BigDecimal.ZERO;
        
        for (WeightedESGScore score : scores) {
            int scoreValue = switch (scoreType) {
                case "overall" -> score.getOverallScore();
                case "environmental" -> score.getEnvironmentalScore();
                case "social" -> score.getSocialScore();
                case "governance" -> score.getGovernanceScore();
                default -> 0;
            };
            
            weightedSum += scoreValue * score.getWeight().doubleValue();
            totalWeight = totalWeight.add(score.getWeight());
        }
        
        return (int) Math.round(weightedSum / totalWeight.doubleValue());
    }
    
    private ESGImpactSummaryDto calculateImpactMetrics(PortfolioHoldingsDto portfolio) {
        double totalCO2Avoided = 0;
        double renewableEnergySupported = 0;
        int jobsSupported = 0;
        
        for (HoldingDto holding : portfolio.getHoldings()) {
            CompanyESGScore company = companyESGScoreRepository.findBySymbol(holding.getSymbol()).orElse(null);
            if (company != null) {
                // Calculate proportional impact based on investment
                double investmentRatio = holding.getMarketValue().doubleValue() / 1000000; // Per million invested
                
                totalCO2Avoided += (100 - company.getCarbonEmissions()) * investmentRatio;
                renewableEnergySupported += company.getRenewableEnergyUsage() * investmentRatio;
                jobsSupported += (int) (company.getEmployeeSatisfaction() * investmentRatio);
            }
        }
        
        return ESGImpactSummaryDto.builder()
                .totalCO2Avoided(Math.round(totalCO2Avoided * 100) / 100.0)
                .equivalentTreesPlanted((int) (totalCO2Avoided * 16.5)) // 1 tree absorbs ~60lbs CO2/year
                .renewableEnergySupported(Math.round(renewableEnergySupported * 100) / 100.0)
                .jobsSupported(jobsSupported)
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
        
        if (criteria.getExcludedSectors() != null && criteria.getExcludedSectors().contains(company.getSector())) {
            return false;
        }
        
        if (criteria.getIncludedSectors() != null && !criteria.getIncludedSectors().isEmpty() 
                && !criteria.getIncludedSectors().contains(company.getSector())) {
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
                .trend(entity.getTrend().name())
                .sector(entity.getSector())
                .lastUpdated(entity.getLastUpdated())
                .build();
    }
    
    // Additional helper methods would be implemented here...
}