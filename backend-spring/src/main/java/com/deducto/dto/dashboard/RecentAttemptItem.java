package com.deducto.dto.dashboard;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record RecentAttemptItem(
        long id,
        long quizId,
        String startedAt,
        String completedAt,
        Double scorePct,
        Integer coinsEarned
) {
}
