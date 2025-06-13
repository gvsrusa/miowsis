package com.miowsis.ai.controller;

import com.miowsis.ai.dto.*;
import com.miowsis.ai.service.AiAssistantService;
import com.miowsis.ai.service.MarketInsightsService;
import com.miowsis.ai.service.PortfolioAdvisorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Tag(name = "AI Assistant", description = "AI-powered assistant and insights")
public class AiAssistantController {
    
    private final AiAssistantService assistantService;
    private final PortfolioAdvisorService portfolioAdvisorService;
    private final MarketInsightsService marketInsightsService;
    
    @PostMapping("/chat")
    @Operation(summary = "Chat with AI assistant")
    public Mono<ChatResponse> chat(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody ChatRequest request) {
        return assistantService.chat(userId, request);
    }
    
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream chat response from AI assistant")
    public Flux<ChatStreamResponse> chatStream(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody ChatRequest request) {
        return assistantService.chatStream(userId, request);
    }
    
    @GetMapping("/portfolio/recommendations")
    @Operation(summary = "Get AI-powered portfolio recommendations")
    public Mono<PortfolioRecommendation> getPortfolioRecommendations(
            @RequestHeader("X-User-Id") UUID userId) {
        return portfolioAdvisorService.getRecommendations(userId);
    }
    
    @PostMapping("/portfolio/optimize")
    @Operation(summary = "Get portfolio optimization suggestions")
    public Mono<OptimizationSuggestion> optimizePortfolio(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody OptimizationRequest request) {
        return portfolioAdvisorService.optimizePortfolio(userId, request);
    }
    
    @GetMapping("/insights/market")
    @Operation(summary = "Get AI-generated market insights")
    public Mono<MarketInsights> getMarketInsights(
            @RequestParam(defaultValue = "GENERAL") String sector) {
        return marketInsightsService.getInsights(sector);
    }
    
    @GetMapping("/insights/esg-trends")
    @Operation(summary = "Get ESG market trends and analysis")
    public Mono<ESGTrendsAnalysis> getESGTrends() {
        return marketInsightsService.getESGTrends();
    }
    
    @PostMapping("/analyze/company")
    @Operation(summary = "Get AI analysis of a specific company")
    public Mono<CompanyAnalysis> analyzeCompany(
            @Valid @RequestBody CompanyAnalysisRequest request) {
        return marketInsightsService.analyzeCompany(request.getSymbol());
    }
    
    @PostMapping("/goals/advice")
    @Operation(summary = "Get personalized advice for investment goals")
    public Mono<GoalAdvice> getGoalAdvice(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody GoalAdviceRequest request) {
        return assistantService.getGoalAdvice(userId, request);
    }
    
    @PostMapping("/education/explain")
    @Operation(summary = "Explain financial concepts in simple terms")
    public Mono<ConceptExplanation> explainConcept(
            @Valid @RequestBody ExplainRequest request) {
        return assistantService.explainConcept(request.getConcept(), request.getComplexityLevel());
    }
}