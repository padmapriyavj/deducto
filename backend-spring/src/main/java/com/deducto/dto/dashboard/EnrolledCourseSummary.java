package com.deducto.dto.dashboard;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record EnrolledCourseSummary(
        long id,
        String name,
        String joinCode,
        String description,
        int testsTaken,
        int coinsEarned
) {
}
