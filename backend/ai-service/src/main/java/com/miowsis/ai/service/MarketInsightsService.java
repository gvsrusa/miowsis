package com.miowsis.ai.service;

import com.miowsis.ai.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class MarketInsightsService {
    
    private final AiAssistantService aiAssistantService;
    
    public Mono<MarketInsights> getMarketInsights(String sectors) {
        return Mono.just(MarketInsights.builder()
                .timestamp(LocalDateTime.now())
                .sectors(Arrays.asList(sectors.split(",")))
                .overallSentiment("NEUTRAL")
                .keyTrends(generateKeyTrends())
                .recommendations(generateMarketRecommendations())
                .build());
    }
    
    public Mono<ESGTrendsAnalysis> getESGTrends() {
        return Mono.just(ESGTrendsAnalysis.builder()
                .timestamp(LocalDateTime.now())
                .topESGCompanies(getTopESGCompanies())
                .emergingTrends(getEmergingESGTrends())
                .regulatoryUpdates(getRegulatorUpdates())
                .build());
    }
    
    public Mono<CompanyAnalysis> analyzeCompany(CompanyAnalysisRequest request) {
        return Mono.just(CompanyAnalysis.builder()
                .symbol(request.getSymbol())
                .companyName(request.getCompanyName())
                .analysisDate(LocalDateTime.now())
                .fundamentalAnalysis(generateFundamentalAnalysis())
                .technicalAnalysis(generateTechnicalAnalysis())
                .esgAnalysis(generateESGAnalysis())
                .recommendation("BUY")
                .targetPrice(150.00)
                .build());
    }
    
    private List<String> generateKeyTrends() {
        return Arrays.asList(
            "AI and technology stocks showing strong momentum",
            "Interest rate cuts expected in Q2 2024",
            "Renewable energy sector gaining investor attention"
        );
    }
    
    private List<String> generateMarketRecommendations() {
        return Arrays.asList(
            "Diversify across sectors to manage risk",
            "Consider defensive stocks for stability",
            "Monitor Fed policy decisions closely"
        );
    }
    
    private List<String> getTopESGCompanies() {
        return Arrays.asList("MSFT", "AAPL", "GOOGL", "JNJ", "PG");
    }
    
    private List<String> getEmergingESGTrends() {
        return Arrays.asList(
            "Carbon neutrality commitments increasing",
            "Social impact investing growing rapidly",
            "Governance reforms in tech sector"
        );
    }
    
    private List<String> getRegulatorUpdates() {
        return Arrays.asList(
            "SEC proposing new climate disclosure rules",
            "EU expanding ESG reporting requirements"
        );
    }
    
    private String generateFundamentalAnalysis() {
        return "Strong revenue growth, healthy margins, and solid balance sheet";
    }
    
    private String generateTechnicalAnalysis() {
        return "Stock trading above 50-day MA, RSI indicates neutral momentum";
    }
    
    private String generateESGAnalysis() {
        return "Strong environmental commitments, improving diversity metrics";
    }
}