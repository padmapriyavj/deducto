package com.deducto.dto.shop;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SpacePlacementUpdateItem(
        @NotNull Long inventoryId,
        @NotBlank String placement
) {
}
