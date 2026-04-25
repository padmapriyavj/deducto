package com.deducto.dto.dashboard;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record LeaderboardEntry(
        String displayName,
        int coins,
        int currentStreak
) {
}
