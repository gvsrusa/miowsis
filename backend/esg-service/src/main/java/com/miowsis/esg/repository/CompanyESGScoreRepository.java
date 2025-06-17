package com.miowsis.esg.repository;

import com.miowsis.esg.entity.CompanyESGScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyESGScoreRepository extends JpaRepository<CompanyESGScore, UUID> {
    Optional<CompanyESGScore> findBySymbol(String symbol);
    
    List<CompanyESGScore> findBySymbolIn(List<String> symbols);
    
    @Query("SELECT c FROM CompanyESGScore c WHERE c.overallScore >= :minScore ORDER BY c.overallScore DESC")
    List<CompanyESGScore> findTopESGCompanies(@Param("minScore") int minScore);
    
    @Query("SELECT c FROM CompanyESGScore c WHERE c.lastUpdated < :cutoffTime")
    List<CompanyESGScore> findOutdatedScores(@Param("cutoffTime") LocalDateTime cutoffTime);
    
    @Query("SELECT c FROM CompanyESGScore c WHERE " +
           "(:minEnvironmental IS NULL OR c.environmentalScore >= :minEnvironmental) AND " +
           "(:minSocial IS NULL OR c.socialScore >= :minSocial) AND " +
           "(:minGovernance IS NULL OR c.governanceScore >= :minGovernance)")
    List<CompanyESGScore> findByESGCriteria(@Param("minEnvironmental") Integer minEnvironmental,
                                           @Param("minSocial") Integer minSocial,
                                           @Param("minGovernance") Integer minGovernance);
}