package com.miowsis.portfolio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "portfolio_id", nullable = false)
    private UUID portfolioId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @Column(name = "symbol", nullable = false)
    private String symbol;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "shares", precision = 19, scale = 8, nullable = false)
    private BigDecimal shares;

    @Column(name = "price", precision = 19, scale = 4, nullable = false)
    private BigDecimal price;

    @Column(name = "amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal amount;

    @Column(name = "fee", precision = 19, scale = 4)
    private BigDecimal fee;

    @Column(name = "net_amount", precision = 19, scale = 4)
    private BigDecimal netAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "source")
    private TransactionSource source;

    @Column(name = "round_up_amount", precision = 19, scale = 4)
    private BigDecimal roundUpAmount;

    @Column(name = "original_purchase_amount", precision = 19, scale = 4)
    private BigDecimal originalPurchaseAmount;

    @Column(name = "merchant_name")
    private String merchantName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private TransactionStatus status;

    @Column(name = "notes")
    private String notes;

    @Column(name = "external_reference_id")
    private String externalReferenceId;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TransactionType {
        BUY, SELL, DIVIDEND, DEPOSIT, WITHDRAWAL, FEE, ROUND_UP, RECURRING
    }

    public enum TransactionSource {
        MANUAL, ROUND_UP, RECURRING, REBALANCE, DIVIDEND_REINVEST, API
    }

    public enum TransactionStatus {
        PENDING, COMPLETED, FAILED, CANCELLED
    }
}