package com.miowsis.portfolio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "portfolios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Portfolio {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "portfolio_name")
    private String portfolioName;

    @Enumerated(EnumType.STRING)
    @Column(name = "portfolio_type")
    private PortfolioType portfolioType;

    @Column(name = "total_value", precision = 19, scale = 4)
    private BigDecimal totalValue;

    @Column(name = "total_cost", precision = 19, scale = 4)
    private BigDecimal totalCost;

    @Column(name = "total_gain", precision = 19, scale = 4)
    private BigDecimal totalGain;

    @Column(name = "total_gain_percent", precision = 5, scale = 2)
    private BigDecimal totalGainPercent;

    @Column(name = "day_gain", precision = 19, scale = 4)
    private BigDecimal dayGain;

    @Column(name = "day_gain_percent", precision = 5, scale = 2)
    private BigDecimal dayGainPercent;

    @Column(name = "cash_balance", precision = 19, scale = 4)
    private BigDecimal cashBalance;

    @Column(name = "esg_score")
    private Integer esgScore;

    @Column(name = "environmental_score")
    private Integer environmentalScore;

    @Column(name = "social_score")
    private Integer socialScore;

    @Column(name = "governance_score")
    private Integer governanceScore;

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Holding> holdings = new ArrayList<>();

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_rebalanced_at")
    private LocalDateTime lastRebalancedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum PortfolioType {
        CONSERVATIVE, MODERATE, AGGRESSIVE, ESG_FOCUSED, CUSTOM
    }
}