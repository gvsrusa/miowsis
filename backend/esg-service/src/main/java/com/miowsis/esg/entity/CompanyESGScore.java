package com.miowsis.esg.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "company_esg_scores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyESGScore {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "symbol", nullable = false)
    private String symbol;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "overall_score", nullable = false)
    private Integer overallScore;

    @Column(name = "environmental_score", nullable = false)
    private Integer environmentalScore;

    @Column(name = "social_score", nullable = false)
    private Integer socialScore;

    @Column(name = "governance_score", nullable = false)
    private Integer governanceScore;

    @Column(name = "carbon_emissions")
    private Double carbonEmissions;

    @Column(name = "renewable_energy_usage")
    private Double renewableEnergyUsage;

    @Column(name = "water_usage")
    private Double waterUsage;

    @Column(name = "waste_recycling_rate")
    private Double wasteRecyclingRate;

    @Column(name = "employee_satisfaction")
    private Double employeeSatisfaction;

    @Column(name = "gender_diversity")
    private Double genderDiversity;

    @Column(name = "community_investment")
    private Double communityInvestment;

    @Column(name = "board_diversity")
    private Double boardDiversity;

    @Column(name = "ethics_violations")
    private Integer ethicsViolations;

    @Column(name = "data_privacy_score")
    private Integer dataPrivacyScore;

    @Column(name = "sector")
    private String sector;

    @Column(name = "industry")
    private String industry;

    @Enumerated(EnumType.STRING)
    @Column(name = "trend")
    private ScoreTrend trend;

    @Column(name = "last_updated")
    private LocalDate lastUpdated;

    @Column(name = "data_source")
    private String dataSource;

    @Column(name = "controversies", columnDefinition = "TEXT")
    private String controversies;

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

    public enum ScoreTrend {
        IMPROVING, STABLE, DECLINING
    }
}