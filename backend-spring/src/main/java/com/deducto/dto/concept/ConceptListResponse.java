package com.deducto.dto.concept;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ConceptListResponse(
        long lessonId,
        List<ConceptItemResponse> concepts
) {
}
