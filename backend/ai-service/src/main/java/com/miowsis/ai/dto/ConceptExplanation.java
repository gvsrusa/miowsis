package com.miowsis.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConceptExplanation {
    private String concept;
    private String complexityLevel;
    private String definition;
    private String explanation;
    private List<String> examples;
    private List<String> relatedConcepts;
    private Map<String, String> keyTerms;
    private List<String> practicalApplications;
}