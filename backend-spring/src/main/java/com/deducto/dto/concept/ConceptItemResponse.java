package com.deducto.dto.concept;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ConceptItemResponse(
        long id,
        long lessonId,
        String name,
        String description
) {
}
