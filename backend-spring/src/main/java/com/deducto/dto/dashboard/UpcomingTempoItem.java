package com.deducto.dto.dashboard;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record UpcomingTempoItem(
        long id,
        long courseId,
        Long lessonId,
        String type,
        String status,
        Integer durationSec,
        String scheduledAt
) {
}
