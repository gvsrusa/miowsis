package com.miowsis.portfolio.repository;

import com.miowsis.portfolio.entity.Holding;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, UUID> {
    Page<Holding> findByPortfolioId(UUID portfolioId, Pageable pageable);
    
    List<Holding> findByPortfolioId(UUID portfolioId);
    
    Optional<Holding> findByPortfolioIdAndSymbol(UUID portfolioId, String symbol);
    
    List<Holding> findByPortfolioIdAndSymbolIn(UUID portfolioId, List<String> symbols);
    
    @Query("SELECT h FROM Holding h WHERE h.portfolio.id = :portfolioId AND h.shares > 0")
    List<Holding> findActiveHoldingsByPortfolioId(@Param("portfolioId") UUID portfolioId);
    
    @Query("SELECT h FROM Holding h WHERE h.portfolio.id = :portfolioId AND h.marketValue >= :minValue")
    List<Holding> findHoldingsByPortfolioIdAndMinValue(@Param("portfolioId") UUID portfolioId, @Param("minValue") BigDecimal minValue);
    
    @Query("SELECT h FROM Holding h WHERE h.symbol = :symbol")
    List<Holding> findAllBySymbol(@Param("symbol") String symbol);
    
    @Query("SELECT DISTINCT h.symbol FROM Holding h WHERE h.portfolio.id = :portfolioId")
    List<String> findDistinctSymbolsByPortfolioId(@Param("portfolioId") UUID portfolioId);
    
    boolean existsByPortfolioIdAndSymbol(UUID portfolioId, String symbol);
}