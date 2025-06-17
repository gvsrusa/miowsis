package com.miowsis.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID userId;
    
    @Column(nullable = false)
    private String sessionId;
    
    @Column(nullable = false, length = 2000)
    private String userMessage;
    
    @Column(columnDefinition = "TEXT")
    private String aiResponse;
    
    @Column(nullable = false)
    private String messageType; // "chat", "recommendation", "analysis"
    
    private String context;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
}