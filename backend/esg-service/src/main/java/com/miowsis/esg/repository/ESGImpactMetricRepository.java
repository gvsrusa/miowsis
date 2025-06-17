package com.miowsis.esg.repository;

import com.miowsis.esg.entity.ESGImpactMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ESGImpactMetricRepository extends JpaRepository<ESGImpactMetric, UUID> {
    List<ESGImpactMetric> findByUserId(String userId);
    
    List<ESGImpactMetric> findByUserIdAndMetricType(String userId, String metricType);
    
    @Query("SELECT e FROM ESGImpactMetric e WHERE e.userId = :userId AND e.createdAt >= :startDate AND e.createdAt <= :endDate")
    List<ESGImpactMetric> findByUserIdAndDateRange(@Param("userId") String userId, 
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(e.value) FROM ESGImpactMetric e WHERE e.userId = :userId AND e.metricType = :metricType")
    Double sumMetricByUserAndType(@Param("userId") String userId, @Param("metricType") String metricType);
}