package com.miowsis.portfolio.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellOrderRequest {
    @NotBlank(message = "Symbol is required")
    private String symbol;
    
    @NotNull(message = "Shares is required")
    @DecimalMin(value = "0.00000001", message = "Shares must be greater than 0")
    private BigDecimal shares;
    
    @NotBlank(message = "Order type is required")
    private String orderType;
    
    private BigDecimal limitPrice;
    private String notes;
}