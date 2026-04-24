package com.deducto.dto.lesson;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.time.OffsetDateTime;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record LessonResponse(
        long id,
        long courseId,
        String title,
        int weekNumber,
        Long materialId,
        JsonNode sources,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
