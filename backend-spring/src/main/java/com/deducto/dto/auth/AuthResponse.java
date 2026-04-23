package com.deducto.dto.auth;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record AuthResponse(
        UserResponse user,
        String accessToken,
        String token,
        String tokenType
) {
    public static AuthResponse of(UserResponse user, String accessToken) {
        return new AuthResponse(user, accessToken, accessToken, "bearer");
    }
}
