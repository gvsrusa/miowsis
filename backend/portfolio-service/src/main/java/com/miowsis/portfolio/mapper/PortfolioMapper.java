package com.miowsis.portfolio.mapper;

import com.miowsis.portfolio.dto.HoldingDto;
import com.miowsis.portfolio.dto.PortfolioDto;
import com.miowsis.portfolio.entity.Holding;
import com.miowsis.portfolio.entity.Portfolio;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PortfolioMapper {
    @Mapping(source = "id", target = "id")
    @Mapping(source = "userId", target = "userId")
    @Mapping(source = "updatedAt", target = "lastUpdated")
    PortfolioDto toDto(Portfolio portfolio);
    
    Portfolio toEntity(PortfolioDto dto);
    
    @Mapping(source = "id", target = "id")
    @Mapping(source = "assetType", target = "assetType")
    HoldingDto holdingToDto(Holding holding);
    
    Holding holdingToEntity(HoldingDto dto);
}