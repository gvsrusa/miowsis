package com.miowsis.portfolio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "holdings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Holding {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    @ToString.Exclude
    private Portfolio portfolio;

    @Column(name = "symbol", nullable = false)
    private String symbol;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "shares", precision = 19, scale = 8, nullable = false)
    private BigDecimal shares;

    @Column(name = "avg_cost", precision = 19, scale = 4)
    private BigDecimal avgCost;

    @Column(name = "total_cost", precision = 19, scale = 4)
    private BigDecimal totalCost;

    @Column(name = "current_price", precision = 19, scale = 4)
    private BigDecimal currentPrice;

    @Column(name = "market_value", precision = 19, scale = 4)
    private BigDecimal marketValue;

    @Column(name = "gain_loss", precision = 19, scale = 4)
    private BigDecimal gainLoss;

    @Column(name = "gain_loss_percent", precision = 5, scale = 2)
    private BigDecimal gainLossPercent;

    @Column(name = "day_gain", precision = 19, scale = 4)
    private BigDecimal dayGain;

    @Column(name = "day_gain_percent", precision = 5, scale = 2)
    private BigDecimal dayGainPercent;

    @Column(name = "portfolio_percent", precision = 5, scale = 2)
    private BigDecimal portfolioPercent;

    @Column(name = "esg_score")
    private Integer esgScore;

    @Column(name = "environmental_score")
    private Integer environmentalScore;

    @Column(name = "social_score")
    private Integer socialScore;

    @Column(name = "governance_score")
    private Integer governanceScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type")
    private AssetType assetType;

    @Column(name = "sector")
    private String sector;

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

    public enum AssetType {
        STOCK, ETF, MUTUAL_FUND, BOND, CRYPTO, COMMODITY
    }
}