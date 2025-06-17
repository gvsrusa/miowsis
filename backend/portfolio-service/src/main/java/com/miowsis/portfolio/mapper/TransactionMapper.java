package com.miowsis.portfolio.mapper;

import com.miowsis.portfolio.dto.TransactionDto;
import com.miowsis.portfolio.entity.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransactionMapper {
    @Mapping(source = "id", target = "id")
    @Mapping(source = "userId", target = "userId")
    @Mapping(source = "portfolioId", target = "portfolioId")
    @Mapping(source = "transactionType", target = "transactionType")
    @Mapping(source = "source", target = "source")
    @Mapping(source = "status", target = "status")
    TransactionDto toDto(Transaction transaction);
    
    Transaction toEntity(TransactionDto dto);
}