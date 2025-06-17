package com.miowsis.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExplainRequest {
    @NotBlank
    private String concept;
    
    private String complexityLevel; // "beginner", "intermediate", "advanced"
    private String context; // Additional context for the explanation
}