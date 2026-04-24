package com.deducto.dto.lesson;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/**
 * All fields optional; only non-null fields are applied.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record UpdateLessonRequest(
        String title,
        Integer weekNumber,
        Long materialId,
        String sources
) {
}
