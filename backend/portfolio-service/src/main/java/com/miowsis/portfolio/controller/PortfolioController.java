package com.miowsis.portfolio.controller;

import com.miowsis.portfolio.dto.*;
import com.miowsis.portfolio.service.PortfolioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/portfolios")
@RequiredArgsConstructor
@Tag(name = "Portfolio Management", description = "Portfolio management endpoints")
public class PortfolioController {
    
    private final PortfolioService portfolioService;
    
    @GetMapping("/{userId}")
    @Operation(summary = "Get user portfolio")
    public ResponseEntity<PortfolioDto> getUserPortfolio(@PathVariable UUID userId) {
        return ResponseEntity.ok(portfolioService.getUserPortfolio(userId));
    }
    
    @GetMapping("/{userId}/holdings")
    @Operation(summary = "Get portfolio holdings")
    public ResponseEntity<Page<HoldingDto>> getHoldings(
            @PathVariable UUID userId,
            Pageable pageable) {
        return ResponseEntity.ok(portfolioService.getHoldings(userId, pageable));
    }
    
    @GetMapping("/{userId}/performance")
    @Operation(summary = "Get portfolio performance")
    public ResponseEntity<PortfolioPerformanceDto> getPerformance(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "1M") String period) {
        return ResponseEntity.ok(portfolioService.getPerformance(userId, period));
    }
    
    @PostMapping("/{userId}/buy")
    @Operation(summary = "Buy securities")
    public ResponseEntity<TransactionDto> buySecurities(
            @PathVariable UUID userId,
            @Valid @RequestBody BuyOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(portfolioService.executeBuyOrder(userId, request));
    }
    
    @PostMapping("/{userId}/sell")
    @Operation(summary = "Sell securities")
    public ResponseEntity<TransactionDto> sellSecurities(
            @PathVariable UUID userId,
            @Valid @RequestBody SellOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(portfolioService.executeSellOrder(userId, request));
    }
    
    @PostMapping("/{userId}/rebalance")
    @Operation(summary = "Rebalance portfolio")
    public ResponseEntity<RebalanceResultDto> rebalancePortfolio(
            @PathVariable UUID userId,
            @Valid @RequestBody RebalanceRequest request) {
        return ResponseEntity.ok(portfolioService.rebalancePortfolio(userId, request));
    }
    
    @GetMapping("/{userId}/transactions")
    @Operation(summary = "Get transaction history")
    public ResponseEntity<Page<TransactionDto>> getTransactions(
            @PathVariable UUID userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String symbol,
            Pageable pageable) {
        return ResponseEntity.ok(portfolioService.getTransactions(userId, type, symbol, pageable));
    }
    
    @GetMapping("/{userId}/allocation")
    @Operation(summary = "Get portfolio allocation")
    public ResponseEntity<PortfolioAllocationDto> getAllocation(@PathVariable UUID userId) {
        return ResponseEntity.ok(portfolioService.getPortfolioAllocation(userId));
    }
    
    @PostMapping("/{userId}/round-up")
    @Operation(summary = "Process round-up investment")
    public ResponseEntity<TransactionDto> processRoundUp(
            @PathVariable UUID userId,
            @Valid @RequestBody RoundUpRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(portfolioService.processRoundUp(userId, request));
    }
}