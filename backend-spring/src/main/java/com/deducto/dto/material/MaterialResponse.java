package com.deducto.dto.material;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.time.OffsetDateTime;
import java.util.Map;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record MaterialResponse(
        long id,
        long courseId,
        String type,
        String filename,
        String processingStatus,
        Map<String, Object> metadata,
        OffsetDateTime createdAt
) {
}
