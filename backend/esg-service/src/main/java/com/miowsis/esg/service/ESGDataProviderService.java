package com.miowsis.esg.service;

import com.miowsis.esg.dto.ESGDataDto;
import com.miowsis.esg.entity.CompanyESGScore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Random;

@Service
@Slf4j
@RequiredArgsConstructor
public class ESGDataProviderService {
    
    private final Random random = new Random();
    
    public ESGDataDto fetchESGData(String symbol) {
        // Simulate fetching data from external provider
        // In production, this would call external APIs like MSCI, Sustainalytics, etc.
        
        return ESGDataDto.builder()
                .symbol(symbol)
                .companyName(getCompanyName(symbol))
                .environmentalScore(60 + random.nextInt(40))
                .socialScore(60 + random.nextInt(40))
                .governanceScore(60 + random.nextInt(40))
                .carbonEmissions(1000 + random.nextDouble() * 9000)
                .renewableEnergyUsage(20 + random.nextDouble() * 60)
                .waterUsage(5000 + random.nextDouble() * 15000)
                .wasteRecycled(30 + random.nextDouble() * 50)
                .diversityScore(60 + random.nextInt(40))
                .employeeSatisfaction(70 + random.nextInt(30))
                .communityEngagement(60 + random.nextInt(40))
                .boardDiversity(30 + random.nextInt(50))
                .executiveCompensationRatio(50 + random.nextDouble() * 200)
                .ethicsViolations(random.nextInt(3))
                .lastUpdated(LocalDateTime.now())
                .dataProvider("Simulated ESG Provider")
                .build();
    }
    
    public CompanyESGScore updateESGScore(CompanyESGScore existingScore, ESGDataDto newData) {
        existingScore.setEnvironmentalScore(newData.getEnvironmentalScore());
        existingScore.setSocialScore(newData.getSocialScore());
        existingScore.setGovernanceScore(newData.getGovernanceScore());
        existingScore.setOverallScore(calculateOverallScore(newData));
        existingScore.setCarbonEmissions(newData.getCarbonEmissions());
        existingScore.setRenewableEnergyUsage(newData.getRenewableEnergyUsage());
        existingScore.setGenderDiversity((double) newData.getDiversityScore());
        existingScore.setLastUpdated(LocalDate.now());
        
        return existingScore;
    }
    
    private int calculateOverallScore(ESGDataDto data) {
        return (int) ((data.getEnvironmentalScore() * 0.33) + 
                      (data.getSocialScore() * 0.33) + 
                      (data.getGovernanceScore() * 0.34));
    }
    
    private String getCompanyName(String symbol) {
        return switch (symbol.toUpperCase()) {
            case "AAPL" -> "Apple Inc.";
            case "MSFT" -> "Microsoft Corporation";
            case "GOOGL" -> "Alphabet Inc.";
            case "AMZN" -> "Amazon.com Inc.";
            case "TSLA" -> "Tesla Inc.";
            default -> symbol + " Corporation";
        };
    }
}