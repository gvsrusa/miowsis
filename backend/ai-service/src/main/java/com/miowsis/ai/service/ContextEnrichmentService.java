package com.miowsis.ai.service;

import com.miowsis.ai.dto.ChatRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ContextEnrichmentService {
    
    public Map<String, Object> enrichContext(UUID userId, ChatRequest request) {
        Map<String, Object> context = new HashMap<>();
        
        // Add user context
        context.put("userId", userId.toString());
        context.put("conversationId", request.getConversationId());
        
        // Add conversation context
        if (request.getContext() != null) {
            context.putAll(request.getContext());
        }
        
        // Add system context
        context.put("timestamp", System.currentTimeMillis());
        context.put("platform", "miowsis");
        
        return context;
    }
    
    public String generateSystemPrompt(String messageType, Map<String, Object> context) {
        return switch (messageType.toLowerCase()) {
            case "investment" -> "You are a helpful investment advisor assistant. Provide accurate, educational, and personalized investment guidance.";
            case "esg" -> "You are an ESG (Environmental, Social, Governance) expert. Help users understand ESG investing and sustainable finance.";
            case "education" -> "You are a financial education assistant. Explain concepts clearly and provide practical examples.";
            default -> "You are Miowsis AI Assistant, helping users with investment and financial questions.";
        };
    }
}