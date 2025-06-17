package com.miowsis.ai.repository;

import com.miowsis.ai.entity.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChatHistoryRepository extends JpaRepository<ChatHistory, UUID> {
    List<ChatHistory> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    List<ChatHistory> findByUserIdAndSessionIdOrderByCreatedAtDesc(UUID userId, String sessionId);
    
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.userId = :userId AND ch.createdAt >= :since ORDER BY ch.createdAt DESC")
    List<ChatHistory> findRecentChatHistory(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(ch) FROM ChatHistory ch WHERE ch.userId = :userId AND ch.createdAt >= :since")
    long countUserMessagesInPeriod(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
}