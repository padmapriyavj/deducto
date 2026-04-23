package com.deducto.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ErrorDetailResponse(@JsonProperty("detail") String detail) {
}
