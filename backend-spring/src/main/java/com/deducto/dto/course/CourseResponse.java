package com.deducto.dto.course;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.time.OffsetDateTime;
import java.util.Map;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record CourseResponse(
        long id,
        long professorId,
        String name,
        String description,
        Map<String, Object> schedule,
        String joinCode,
        OffsetDateTime createdAt
) {
}
