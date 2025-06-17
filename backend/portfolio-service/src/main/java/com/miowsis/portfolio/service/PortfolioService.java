package com.miowsis.portfolio.service;

import com.miowsis.portfolio.dto.*;
import com.miowsis.portfolio.entity.Holding;
import com.miowsis.portfolio.entity.Portfolio;
import com.miowsis.portfolio.entity.Transaction;
import com.miowsis.portfolio.exception.InsufficientFundsException;
import com.miowsis.portfolio.exception.PortfolioNotFoundException;
import com.miowsis.portfolio.mapper.PortfolioMapper;
import com.miowsis.portfolio.mapper.TransactionMapper;
import com.miowsis.portfolio.repository.HoldingRepository;
import com.miowsis.portfolio.repository.PortfolioRepository;
import com.miowsis.portfolio.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
public class PortfolioService {
    
    private final PortfolioRepository portfolioRepository;
    private final HoldingRepository holdingRepository;
    private final TransactionRepository transactionRepository;
    private final MarketDataService marketDataService;
    private final ESGScoringService esgScoringService;
    private final PortfolioMapper portfolioMapper;
    private final TransactionMapper transactionMapper;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public PortfolioService(
            PortfolioRepository portfolioRepository,
            HoldingRepository holdingRepository,
            TransactionRepository transactionRepository,
            MarketDataService marketDataService,
            ESGScoringService esgScoringService,
            PortfolioMapper portfolioMapper,
            TransactionMapper transactionMapper,
            @Autowired(required = false) KafkaTemplate<String, Object> kafkaTemplate) {
        this.portfolioRepository = portfolioRepository;
        this.holdingRepository = holdingRepository;
        this.transactionRepository = transactionRepository;
        this.marketDataService = marketDataService;
        this.esgScoringService = esgScoringService;
        this.portfolioMapper = portfolioMapper;
        this.transactionMapper = transactionMapper;
        this.kafkaTemplate = kafkaTemplate;
    }
    
    @Cacheable(value = "portfolios", key = "#userId")
    public PortfolioDto getUserPortfolio(UUID userId) {
        Portfolio portfolio = portfolioRepository.findByUserIdAndIsActive(userId, true)
                .orElseGet(() -> createDefaultPortfolio(userId));
        
        // Update real-time values
        updatePortfolioValues(portfolio);
        
        return portfolioMapper.toDto(portfolio);
    }
    
    public Page<HoldingDto> getHoldings(UUID userId, Pageable pageable) {
        Portfolio portfolio = getPortfolioByUserId(userId);
        Page<Holding> holdings = holdingRepository.findByPortfolioId(portfolio.getId(), pageable);
        return holdings.map(portfolioMapper::holdingToDto);
    }
    
    @Transactional
    @CacheEvict(value = "portfolios", key = "#userId")
    public TransactionDto executeBuyOrder(UUID userId, BuyOrderRequest request) {
        Portfolio portfolio = getPortfolioByUserId(userId);
        
        // Check available funds
        if (portfolio.getCashBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientFundsException("Insufficient funds for purchase");
        }
        
        // Get current market price
        BigDecimal currentPrice = marketDataService.getCurrentPrice(request.getSymbol());
        BigDecimal shares = request.getAmount().divide(currentPrice, 8, RoundingMode.DOWN);
        
        // Create or update holding
        Holding holding = holdingRepository.findByPortfolioIdAndSymbol(portfolio.getId(), request.getSymbol())
                .orElse(createNewHolding(portfolio, request.getSymbol()));
        
        updateHoldingForBuy(holding, shares, currentPrice, request.getAmount());
        holdingRepository.save(holding);
        
        // Update portfolio cash balance
        portfolio.setCashBalance(portfolio.getCashBalance().subtract(request.getAmount()));
        portfolioRepository.save(portfolio);
        
        // Create transaction record
        Transaction transaction = createBuyTransaction(userId, portfolio.getId(), request, shares, currentPrice);
        transactionRepository.save(transaction);
        
        // Publish event
        publishTransactionEvent(transaction, "portfolio.buy");
        
        return transactionMapper.toDto(transaction);
    }
    
    @Transactional
    @CacheEvict(value = "portfolios", key = "#userId")
    public TransactionDto executeSellOrder(UUID userId, SellOrderRequest request) {
        Portfolio portfolio = getPortfolioByUserId(userId);
        
        Holding holding = holdingRepository.findByPortfolioIdAndSymbol(portfolio.getId(), request.getSymbol())
                .orElseThrow(() -> new IllegalArgumentException("No holdings found for symbol: " + request.getSymbol()));
        
        // Validate shares
        if (holding.getShares().compareTo(request.getShares()) < 0) {
            throw new IllegalArgumentException("Insufficient shares to sell");
        }
        
        // Get current market price
        BigDecimal currentPrice = marketDataService.getCurrentPrice(request.getSymbol());
        BigDecimal saleAmount = request.getShares().multiply(currentPrice);
        
        // Update holding
        updateHoldingForSell(holding, request.getShares());
        
        if (holding.getShares().compareTo(BigDecimal.ZERO) == 0) {
            holdingRepository.delete(holding);
        } else {
            holdingRepository.save(holding);
        }
        
        // Update portfolio cash balance
        portfolio.setCashBalance(portfolio.getCashBalance().add(saleAmount));
        portfolioRepository.save(portfolio);
        
        // Create transaction record
        Transaction transaction = createSellTransaction(userId, portfolio.getId(), request, currentPrice, saleAmount);
        transactionRepository.save(transaction);
        
        // Publish event
        publishTransactionEvent(transaction, "portfolio.sell");
        
        return transactionMapper.toDto(transaction);
    }
    
    @Transactional
    @CacheEvict(value = "portfolios", key = "#userId")
    public TransactionDto processRoundUp(UUID userId, RoundUpRequest request) {
        Portfolio portfolio = getPortfolioByUserId(userId);
        
        // Calculate round-up amount
        BigDecimal purchaseAmount = request.getPurchaseAmount();
        BigDecimal roundedAmount = purchaseAmount.setScale(0, RoundingMode.CEILING);
        BigDecimal roundUpAmount = roundedAmount.subtract(purchaseAmount);
        
        if (roundUpAmount.compareTo(BigDecimal.ZERO) == 0) {
            roundUpAmount = BigDecimal.ONE; // Always invest at least $1
        }
        
        // Execute round-up investment
        BuyOrderRequest buyRequest = BuyOrderRequest.builder()
                .symbol(request.getTargetSymbol() != null ? request.getTargetSymbol() : "VTI") // Default to total market ETF
                .amount(roundUpAmount)
                .orderType("MARKET")
                .build();
        
        TransactionDto transaction = executeBuyOrder(userId, buyRequest);
        
        // Update transaction with round-up details
        Transaction roundUpTransaction = transactionRepository.findById(UUID.fromString(transaction.getId())).orElseThrow();
        roundUpTransaction.setSource(Transaction.TransactionSource.ROUND_UP);
        roundUpTransaction.setRoundUpAmount(roundUpAmount);
        roundUpTransaction.setOriginalPurchaseAmount(purchaseAmount);
        roundUpTransaction.setMerchantName(request.getMerchantName());
        transactionRepository.save(roundUpTransaction);
        
        return transactionMapper.toDto(roundUpTransaction);
    }
    
    public PortfolioPerformanceDto getPerformance(UUID userId, String period) {
        Portfolio portfolio = getPortfolioByUserId(userId);
        // Implementation would fetch historical data and calculate performance metrics
        return PortfolioPerformanceDto.builder()
                .userId(userId.toString())
                .period(period)
                .totalReturn(portfolio.getTotalGainPercent())
                .annualizedReturn(calculateAnnualizedReturn(portfolio, period))
                .volatility(calculateVolatility(portfolio, period))
                .sharpeRatio(calculateSharpeRatio(portfolio, period))
                .build();
    }
    
    private Portfolio getPortfolioByUserId(UUID userId) {
        return portfolioRepository.findByUserIdAndIsActive(userId, true)
                .orElseThrow(() -> new PortfolioNotFoundException("Portfolio not found for user: " + userId));
    }
    
    private Portfolio createDefaultPortfolio(UUID userId) {
        Portfolio portfolio = Portfolio.builder()
                .userId(userId)
                .portfolioName("My Portfolio")
                .portfolioType(Portfolio.PortfolioType.MODERATE)
                .totalValue(BigDecimal.ZERO)
                .totalCost(BigDecimal.ZERO)
                .totalGain(BigDecimal.ZERO)
                .totalGainPercent(BigDecimal.ZERO)
                .dayGain(BigDecimal.ZERO)
                .dayGainPercent(BigDecimal.ZERO)
                .cashBalance(BigDecimal.ZERO)
                .isActive(true)
                .build();
        
        return portfolioRepository.save(portfolio);
    }
    
    private void updatePortfolioValues(Portfolio portfolio) {
        BigDecimal totalValue = portfolio.getCashBalance();
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal dayGain = BigDecimal.ZERO;
        
        for (Holding holding : portfolio.getHoldings()) {
            BigDecimal currentPrice = marketDataService.getCurrentPrice(holding.getSymbol());
            BigDecimal marketValue = holding.getShares().multiply(currentPrice);
            
            holding.setCurrentPrice(currentPrice);
            holding.setMarketValue(marketValue);
            holding.setGainLoss(marketValue.subtract(holding.getTotalCost()));
            holding.setGainLossPercent(calculatePercentChange(holding.getTotalCost(), marketValue));
            
            totalValue = totalValue.add(marketValue);
            totalCost = totalCost.add(holding.getTotalCost());
            dayGain = dayGain.add(holding.getDayGain());
        }
        
        portfolio.setTotalValue(totalValue);
        portfolio.setTotalCost(totalCost);
        portfolio.setTotalGain(totalValue.subtract(totalCost));
        portfolio.setTotalGainPercent(calculatePercentChange(totalCost, totalValue));
        portfolio.setDayGain(dayGain);
        portfolio.setDayGainPercent(calculatePercentChange(totalValue.subtract(dayGain), totalValue));
        
        // Update ESG scores
        updatePortfolioESGScores(portfolio);
    }
    
    private BigDecimal calculatePercentChange(BigDecimal original, BigDecimal current) {
        if (original.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return current.subtract(original)
                .divide(original, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }
    
    private void updatePortfolioESGScores(Portfolio portfolio) {
        ESGScoreDto portfolioESG = esgScoringService.calculatePortfolioESGScore(portfolio);
        portfolio.setEsgScore(portfolioESG.getOverallScore());
        portfolio.setEnvironmentalScore(portfolioESG.getEnvironmentalScore());
        portfolio.setSocialScore(portfolioESG.getSocialScore());
        portfolio.setGovernanceScore(portfolioESG.getGovernanceScore());
    }
    
    private void publishTransactionEvent(Transaction transaction, String eventType) {
        if (kafkaTemplate == null) {
            log.debug("Kafka is disabled - skipping transaction event publication");
            return;
        }
        
        try {
            kafkaTemplate.send("portfolio-events", eventType, transaction);
        } catch (Exception e) {
            log.warn("Failed to publish transaction event: {}", e.getMessage());
            // Continue without failing the transaction
        }
    }
    
    @Transactional
    @CacheEvict(value = "portfolios", key = "#userId")
    public RebalanceResultDto rebalancePortfolio(UUID userId, RebalanceRequest request) {
        Portfolio portfolio = getPortfolioByUserId(userId);
        // Mock implementation for rebalancing
        return RebalanceResultDto.builder()
                .portfolioId(portfolio.getId().toString())
                .strategy(request.getStrategy())
                .status("COMPLETED")
                .totalCost(BigDecimal.ZERO)
                .totalFees(BigDecimal.ZERO)
                .executedAt(LocalDateTime.now())
                .build();
    }
    
    public Page<TransactionDto> getTransactions(UUID userId, String type, String symbol, Pageable pageable) {
        if (type != null && symbol != null) {
            Transaction.TransactionType transactionType = Transaction.TransactionType.valueOf(type.toUpperCase());
            return transactionRepository.findByUserIdAndTransactionTypeAndSymbol(userId, transactionType, symbol, pageable)
                    .map(transactionMapper::toDto);
        } else if (type != null) {
            Transaction.TransactionType transactionType = Transaction.TransactionType.valueOf(type.toUpperCase());
            return transactionRepository.findByUserIdAndTransactionType(userId, transactionType, pageable)
                    .map(transactionMapper::toDto);
        } else if (symbol != null) {
            return transactionRepository.findByUserIdAndSymbol(userId, symbol, pageable)
                    .map(transactionMapper::toDto);
        } else {
            return transactionRepository.findByUserId(userId, pageable)
                    .map(transactionMapper::toDto);
        }
    }
    
    public PortfolioAllocationDto getPortfolioAllocation(UUID userId) {
        Portfolio portfolio = getPortfolioByUserId(userId);
        
        // Mock implementation for allocation
        return PortfolioAllocationDto.builder()
                .portfolioId(portfolio.getId().toString())
                .userId(userId.toString())
                .totalValue(portfolio.getTotalValue())
                .build();
    }
    
    private Holding createNewHolding(Portfolio portfolio, String symbol) {
        return Holding.builder()
                .portfolio(portfolio)
                .symbol(symbol)
                .shares(BigDecimal.ZERO)
                .avgCost(BigDecimal.ZERO)
                .totalCost(BigDecimal.ZERO)
                .currentPrice(BigDecimal.ZERO)
                .marketValue(BigDecimal.ZERO)
                .gainLoss(BigDecimal.ZERO)
                .gainLossPercent(BigDecimal.ZERO)
                .dayGain(BigDecimal.ZERO)
                .dayGainPercent(BigDecimal.ZERO)
                .portfolioPercent(BigDecimal.ZERO)
                .build();
    }
    
    private void updateHoldingForBuy(Holding holding, BigDecimal newShares, BigDecimal price, BigDecimal amount) {
        BigDecimal totalShares = holding.getShares().add(newShares);
        BigDecimal totalCost = holding.getTotalCost().add(amount);
        BigDecimal avgCost = totalCost.divide(totalShares, 4, RoundingMode.HALF_UP);
        
        holding.setShares(totalShares);
        holding.setTotalCost(totalCost);
        holding.setAvgCost(avgCost);
        holding.setCurrentPrice(price);
        holding.setMarketValue(totalShares.multiply(price));
    }
    
    private void updateHoldingForSell(Holding holding, BigDecimal sharesToSell) {
        BigDecimal remainingShares = holding.getShares().subtract(sharesToSell);
        BigDecimal remainingCost = holding.getTotalCost()
                .multiply(remainingShares)
                .divide(holding.getShares(), 4, RoundingMode.HALF_UP);
        
        holding.setShares(remainingShares);
        holding.setTotalCost(remainingCost);
        if (remainingShares.compareTo(BigDecimal.ZERO) > 0) {
            holding.setMarketValue(remainingShares.multiply(holding.getCurrentPrice()));
        }
    }
    
    private Transaction createBuyTransaction(UUID userId, UUID portfolioId, BuyOrderRequest request, 
            BigDecimal shares, BigDecimal price) {
        return Transaction.builder()
                .userId(userId)
                .portfolioId(portfolioId)
                .transactionType(Transaction.TransactionType.BUY)
                .symbol(request.getSymbol())
                .shares(shares)
                .price(price)
                .amount(request.getAmount())
                .fee(BigDecimal.ZERO)
                .netAmount(request.getAmount())
                .source(Transaction.TransactionSource.MANUAL)
                .status(Transaction.TransactionStatus.COMPLETED)
                .executedAt(LocalDateTime.now())
                .build();
    }
    
    private Transaction createSellTransaction(UUID userId, UUID portfolioId, SellOrderRequest request, 
            BigDecimal price, BigDecimal saleAmount) {
        return Transaction.builder()
                .userId(userId)
                .portfolioId(portfolioId)
                .transactionType(Transaction.TransactionType.SELL)
                .symbol(request.getSymbol())
                .shares(request.getShares())
                .price(price)
                .amount(saleAmount)
                .fee(BigDecimal.ZERO)
                .netAmount(saleAmount)
                .source(Transaction.TransactionSource.MANUAL)
                .status(Transaction.TransactionStatus.COMPLETED)
                .executedAt(LocalDateTime.now())
                .build();
    }
    
    private BigDecimal calculateAnnualizedReturn(Portfolio portfolio, String period) {
        // Mock implementation
        return portfolio.getTotalGainPercent();
    }
    
    private BigDecimal calculateVolatility(Portfolio portfolio, String period) {
        // Mock implementation
        return BigDecimal.valueOf(15.5);
    }
    
    private BigDecimal calculateSharpeRatio(Portfolio portfolio, String period) {
        // Mock implementation
        return BigDecimal.valueOf(1.2);
    }
}