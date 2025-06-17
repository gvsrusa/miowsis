package com.miowsis.portfolio.repository;

import com.miowsis.portfolio.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, UUID> {
    Optional<Portfolio> findByUserIdAndIsActive(UUID userId, boolean isActive);
    
    List<Portfolio> findByUserId(UUID userId);
    
    boolean existsByUserIdAndIsActive(UUID userId, boolean isActive);
    
    @Query("SELECT p FROM Portfolio p WHERE p.userId = :userId AND p.isActive = true")
    Optional<Portfolio> findActivePortfolioByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT p FROM Portfolio p WHERE p.updatedAt < :cutoffTime AND p.isActive = true")
    List<Portfolio> findActivePortfoliosNotUpdatedSince(@Param("cutoffTime") LocalDateTime cutoffTime);
    
    @Query("SELECT COUNT(p) FROM Portfolio p WHERE p.createdAt >= :startDate AND p.createdAt < :endDate")
    long countPortfoliosCreatedBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}