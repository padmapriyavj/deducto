package com.deducto.dto.lesson;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record CreateLessonRequest(
        @NotBlank String title,
        @Positive int weekNumber,
        Long materialId,
        String sources
) {
}
