package com.deducto.dto.api;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ApiFieldErrorItem(
        @JsonProperty("field") String field,
        @JsonProperty("message") String message
) {
}
