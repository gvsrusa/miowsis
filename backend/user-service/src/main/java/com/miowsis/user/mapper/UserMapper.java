package com.miowsis.user.mapper;

import com.miowsis.user.dto.UserDto;
import com.miowsis.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    
    @Mapping(source = "id", target = "id")
    @Mapping(source = "kycStatus", target = "kycStatus")
    UserDto toDto(User user);
    
    @Mapping(source = "id", target = "id")
    @Mapping(source = "kycStatus", target = "kycStatus", ignore = true)
    User toEntity(UserDto dto);
}