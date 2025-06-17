package com.miowsis.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {
    private String id;
    private String userId;
    private String portfolioId;
    private String transactionType;
    private String symbol;
    private String companyName;
    private BigDecimal shares;
    private BigDecimal price;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal netAmount;
    private String source;
    private BigDecimal roundUpAmount;
    private BigDecimal originalPurchaseAmount;
    private String merchantName;
    private String status;
    private String notes;
    private String externalReferenceId;
    private LocalDateTime executedAt;
    private LocalDateTime createdAt;
}