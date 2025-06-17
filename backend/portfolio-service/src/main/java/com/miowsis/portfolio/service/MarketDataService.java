package com.miowsis.portfolio.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class MarketDataService {
    
    // Mock market data for testing purposes
    private final Map<String, BigDecimal> mockPrices = new HashMap<>();
    
    public MarketDataService() {
        // Initialize with some mock data
        mockPrices.put("AAPL", new BigDecimal("150.00"));
        mockPrices.put("GOOGL", new BigDecimal("2800.00"));
        mockPrices.put("MSFT", new BigDecimal("330.00"));
        mockPrices.put("TSLA", new BigDecimal("800.00"));
        mockPrices.put("VTI", new BigDecimal("220.00"));
        mockPrices.put("SPY", new BigDecimal("450.00"));
    }
    
    public BigDecimal getCurrentPrice(String symbol) {
        log.info("Fetching current price for symbol: {}", symbol);
        
        // In a real implementation, this would call an external market data API
        // For now, return mock data or a default price
        BigDecimal price = mockPrices.getOrDefault(symbol, new BigDecimal("100.00"));
        
        log.debug("Current price for {} is {}", symbol, price);
        return price;
    }
    
    public Map<String, BigDecimal> getCurrentPrices(java.util.List<String> symbols) {
        log.info("Fetching current prices for {} symbols", symbols.size());
        
        Map<String, BigDecimal> prices = new HashMap<>();
        for (String symbol : symbols) {
            prices.put(symbol, getCurrentPrice(symbol));
        }
        
        return prices;
    }
    
    public BigDecimal getPreviousClosePrice(String symbol) {
        log.info("Fetching previous close price for symbol: {}", symbol);
        
        // Mock implementation - return slightly different price
        BigDecimal currentPrice = getCurrentPrice(symbol);
        return currentPrice.multiply(new BigDecimal("0.995")); // 0.5% lower
    }
}