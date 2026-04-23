package com.deducto.dto.course;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.Map;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record StudentResponse(
        long id,
        String email,
        String displayName,
        Map<String, Object> avatarConfig,
        int coins,
        int currentStreak
) {
}
