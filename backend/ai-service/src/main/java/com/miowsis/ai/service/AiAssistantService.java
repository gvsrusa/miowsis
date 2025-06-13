package com.miowsis.ai.service;

import com.miowsis.ai.config.OpenAIConfig;
import com.miowsis.ai.dto.*;
import com.miowsis.ai.entity.ChatHistory;
import com.miowsis.ai.repository.ChatHistoryRepository;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatCompletionResult;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiAssistantService {
    
    private final OpenAiService openAiService;
    private final ChatHistoryRepository chatHistoryRepository;
    private final ContextEnrichmentService contextService;
    private final OpenAIConfig config;
    
    private static final String SYSTEM_PROMPT = """
        You are MIOwSIS AI, a friendly and knowledgeable investment assistant specializing in 
        micro-investments and ESG (Environmental, Social, Governance) investing.
        
        Your role is to:
        1. Help users understand investing concepts in simple terms
        2. Provide personalized investment advice based on their goals and risk tolerance
        3. Explain ESG scores and their impact on investments
        4. Guide users through the platform features
        5. Answer questions about their portfolio and market trends
        
        Always:
        - Be conversational and approachable
        - Use simple language, avoiding complex financial jargon
        - Provide specific examples when explaining concepts
        - Consider the user's investment experience level
        - Emphasize the importance of long-term investing and diversification
        - Highlight ESG considerations when relevant
        
        Never:
        - Provide guarantees about investment returns
        - Give advice on specific timing of trades
        - Recommend investing money the user cannot afford to lose
        - Share other users' information
        """;
    
    public Mono<ChatResponse> chat(UUID userId, ChatRequest request) {
        return enrichContext(userId, request)
                .flatMap(context -> {
                    List<ChatMessage> messages = buildMessages(userId, request, context);
                    
                    ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                            .model(config.getModel())
                            .messages(messages)
                            .maxTokens(config.getMaxTokens())
                            .temperature(config.getTemperature())
                            .build();
                    
                    return Mono.fromCallable(() -> openAiService.createChatCompletion(completionRequest))
                            .map(result -> {
                                String response = result.getChoices().get(0).getMessage().getContent();
                                saveChat(userId, request.getMessage(), response);
                                
                                return ChatResponse.builder()
                                        .message(response)
                                        .conversationId(UUID.randomUUID().toString())
                                        .timestamp(LocalDateTime.now())
                                        .suggestions(generateSuggestions(response))
                                        .build();
                            });
                });
    }
    
    public Flux<ChatStreamResponse> chatStream(UUID userId, ChatRequest request) {
        return enrichContext(userId, request)
                .flatMapMany(context -> {
                    List<ChatMessage> messages = buildMessages(userId, request, context);
                    
                    ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                            .model(config.getModel())
                            .messages(messages)
                            .maxTokens(config.getMaxTokens())
                            .temperature(config.getTemperature())
                            .stream(true)
                            .build();
                    
                    return Flux.create(sink -> {
                        StringBuilder fullResponse = new StringBuilder();
                        
                        openAiService.streamChatCompletion(completionRequest)
                                .doOnNext(chunk -> {
                                    String content = chunk.getChoices().get(0).getMessage().getContent();
                                    if (content != null) {
                                        fullResponse.append(content);
                                        sink.next(ChatStreamResponse.builder()
                                                .content(content)
                                                .isComplete(false)
                                                .build());
                                    }
                                })
                                .doOnComplete(() -> {
                                    saveChat(userId, request.getMessage(), fullResponse.toString());
                                    sink.next(ChatStreamResponse.builder()
                                            .content("")
                                            .isComplete(true)
                                            .conversationId(UUID.randomUUID().toString())
                                            .build());
                                    sink.complete();
                                })
                                .doOnError(sink::error)
                                .subscribe();
                    });
                });
    }
    
    public Mono<GoalAdvice> getGoalAdvice(UUID userId, GoalAdviceRequest request) {
        String prompt = String.format("""
            The user has the following investment goal: %s
            Current portfolio value: $%.2f
            Monthly investment capacity: $%.2f
            Time horizon: %s
            Risk tolerance: %s
            
            Provide specific, actionable advice on:
            1. How to achieve this goal
            2. Recommended portfolio allocation
            3. Expected timeline and milestones
            4. Potential challenges and how to overcome them
            5. ESG investment options that align with this goal
            """, 
            request.getGoal(),
            request.getCurrentPortfolioValue(),
            request.getMonthlyInvestment(),
            request.getTimeHorizon(),
            request.getRiskTolerance()
        );
        
        return generateResponse(prompt)
                .map(response -> GoalAdvice.builder()
                        .goal(request.getGoal())
                        .advice(response)
                        .recommendedActions(extractActionItems(response))
                        .estimatedTimeToGoal(calculateTimeToGoal(request))
                        .build());
    }
    
    public Mono<ConceptExplanation> explainConcept(String concept, String complexityLevel) {
        String prompt = String.format("""
            Explain the financial concept "%s" in %s terms.
            
            Include:
            1. A clear definition
            2. Why it matters for investors
            3. A real-world example
            4. How it relates to micro-investing and ESG
            
            Keep the explanation conversational and easy to understand.
            """, concept, complexityLevel);
        
        return generateResponse(prompt)
                .map(response -> ConceptExplanation.builder()
                        .concept(concept)
                        .explanation(response)
                        .relatedConcepts(extractRelatedConcepts(response))
                        .difficulty(complexityLevel)
                        .build());
    }
    
    private Mono<String> enrichContext(UUID userId, ChatRequest request) {
        return contextService.getUserContext(userId)
                .map(context -> String.format("""
                    User Context:
                    - Portfolio Value: $%.2f
                    - ESG Score: %d
                    - Investment Goals: %s
                    - Risk Profile: %s
                    - Recent Activity: %s
                    """,
                    context.getPortfolioValue(),
                    context.getEsgScore(),
                    String.join(", ", context.getGoals()),
                    context.getRiskProfile(),
                    context.getRecentActivity()
                ));
    }
    
    private List<ChatMessage> buildMessages(UUID userId, ChatRequest request, String context) {
        List<ChatMessage> messages = new ArrayList<>();
        
        // System message
        messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), SYSTEM_PROMPT));
        
        // Add context
        messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), context));
        
        // Add chat history (last 5 messages)
        List<ChatHistory> history = chatHistoryRepository.findTop5ByUserIdOrderByTimestampDesc(userId);
        Collections.reverse(history);
        
        for (ChatHistory chat : history) {
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), chat.getUserMessage()));
            messages.add(new ChatMessage(ChatMessageRole.ASSISTANT.value(), chat.getAssistantResponse()));
        }
        
        // Add current message
        messages.add(new ChatMessage(ChatMessageRole.USER.value(), request.getMessage()));
        
        return messages;
    }
    
    private Mono<String> generateResponse(String prompt) {
        ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model(config.getModel())
                .messages(List.of(
                    new ChatMessage(ChatMessageRole.SYSTEM.value(), SYSTEM_PROMPT),
                    new ChatMessage(ChatMessageRole.USER.value(), prompt)
                ))
                .maxTokens(config.getMaxTokens())
                .temperature(config.getTemperature())
                .build();
        
        return Mono.fromCallable(() -> openAiService.createChatCompletion(request))
                .map(result -> result.getChoices().get(0).getMessage().getContent());
    }
    
    private void saveChat(UUID userId, String userMessage, String assistantResponse) {
        ChatHistory history = ChatHistory.builder()
                .userId(userId)
                .userMessage(userMessage)
                .assistantResponse(assistantResponse)
                .timestamp(LocalDateTime.now())
                .build();
        
        chatHistoryRepository.save(history).subscribe();
    }
    
    private List<String> generateSuggestions(String response) {
        // Extract potential follow-up questions based on the response
        List<String> suggestions = new ArrayList<>();
        
        if (response.toLowerCase().contains("esg")) {
            suggestions.add("Tell me more about ESG scores");
        }
        if (response.toLowerCase().contains("portfolio")) {
            suggestions.add("How can I optimize my portfolio?");
        }
        if (response.toLowerCase().contains("risk")) {
            suggestions.add("What's my current risk level?");
        }
        
        return suggestions.isEmpty() ? 
            List.of(
                "What are the best ESG investments?",
                "How do round-ups work?",
                "Show me my portfolio performance"
            ) : suggestions;
    }
    
    private List<String> extractActionItems(String response) {
        // Simple extraction of action items from the response
        return Arrays.stream(response.split("\n"))
                .filter(line -> line.matches("^\\d+\\..*") || line.contains("•"))
                .map(line -> line.replaceAll("^[\\d+\\.]\\s*", "").trim())
                .limit(5)
                .collect(Collectors.toList());
    }
    
    private String calculateTimeToGoal(GoalAdviceRequest request) {
        // Simple calculation based on goal amount and monthly investment
        if (request.getGoalAmount() != null && request.getMonthlyInvestment() > 0) {
            double monthsNeeded = request.getGoalAmount() / request.getMonthlyInvestment();
            int years = (int) (monthsNeeded / 12);
            int months = (int) (monthsNeeded % 12);
            return String.format("%d years, %d months", years, months);
        }
        return "Varies based on market conditions";
    }
    
    private List<String> extractRelatedConcepts(String explanation) {
        // Extract related financial concepts mentioned in the explanation
        List<String> commonConcepts = List.of(
            "diversification", "compound interest", "market volatility",
            "dollar-cost averaging", "asset allocation", "risk tolerance",
            "ESG investing", "expense ratio", "dividend yield"
        );
        
        return commonConcepts.stream()
                .filter(concept -> explanation.toLowerCase().contains(concept.toLowerCase()))
                .limit(3)
                .collect(Collectors.toList());
    }
}