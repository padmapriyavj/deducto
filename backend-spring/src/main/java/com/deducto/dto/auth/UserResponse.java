package com.deducto.dto.auth;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.time.OffsetDateTime;
import java.util.Map;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record UserResponse(
        long id,
        String email,
        String role,
        String displayName,
        Map<String, Object> avatarConfig,
        int coins,
        int currentStreak,
        int longestStreak,
        int streakFreezes,
        OffsetDateTime createdAt
) {
}
