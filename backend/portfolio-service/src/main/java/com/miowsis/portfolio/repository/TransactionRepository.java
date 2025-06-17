package com.miowsis.portfolio.repository;

import com.miowsis.portfolio.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Page<Transaction> findByUserId(UUID userId, Pageable pageable);
    
    Page<Transaction> findByUserIdAndTransactionType(UUID userId, Transaction.TransactionType transactionType, Pageable pageable);
    
    Page<Transaction> findByUserIdAndSymbol(UUID userId, String symbol, Pageable pageable);
    
    Page<Transaction> findByUserIdAndTransactionTypeAndSymbol(UUID userId, Transaction.TransactionType transactionType, String symbol, Pageable pageable);
    
    List<Transaction> findByPortfolioId(UUID portfolioId);
    
    List<Transaction> findByPortfolioIdAndSymbol(UUID portfolioId, String symbol);
    
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND t.executedAt >= :startDate AND t.executedAt < :endDate")
    List<Transaction> findByUserIdAndExecutedAtBetween(@Param("userId") UUID userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT t FROM Transaction t WHERE t.portfolioId = :portfolioId AND t.transactionType = :transactionType ORDER BY t.executedAt DESC")
    List<Transaction> findByPortfolioIdAndTransactionTypeOrderByExecutedAtDesc(@Param("portfolioId") UUID portfolioId, @Param("transactionType") Transaction.TransactionType transactionType);
    
    @Query("SELECT t FROM Transaction t WHERE t.source = :source AND t.executedAt >= :startDate")
    List<Transaction> findBySourceAndExecutedAtAfter(@Param("source") Transaction.TransactionSource source, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.userId = :userId AND t.transactionType = :transactionType AND t.executedAt >= :startDate")
    long countByUserIdAndTransactionTypeAndExecutedAtAfter(@Param("userId") UUID userId, @Param("transactionType") Transaction.TransactionType transactionType, @Param("startDate") LocalDateTime startDate);
    
    boolean existsByExternalReferenceId(String externalReferenceId);
}