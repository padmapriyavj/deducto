package com.deducto.dto.shop;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record UserInventoryItemResponse(
        long id,
        long userId,
        long shopItemId,
        String acquiredAt,
        String placement,
        ShopItemResponse item
) {
}
