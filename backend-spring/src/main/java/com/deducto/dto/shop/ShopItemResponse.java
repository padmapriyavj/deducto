package com.deducto.dto.shop;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ShopItemResponse(
        long id,
        String name,
        String category,
        String assetUrl,
        int priceCoins,
        String rarity
) {
}
