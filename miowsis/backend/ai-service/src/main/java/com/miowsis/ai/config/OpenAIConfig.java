package com.miowsis.ai.config;

import com.theokanning.openai.service.OpenAiService;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "openai")
@Getter
@Setter
public class OpenAIConfig {
    private String apiKey;
    private String model = "gpt-4";
    private Integer maxTokens = 1000;
    private Double temperature = 0.7;
    private Duration timeout = Duration.ofSeconds(60);
    
    @Bean
    public OpenAiService openAiService() {
        return new OpenAiService(apiKey, timeout);
    }
}