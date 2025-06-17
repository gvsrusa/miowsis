package com.miowsis.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatStreamResponse {
    private String messageId;
    private String content;
    private boolean isComplete;
    private String type; // "text", "suggestion", "error"
}