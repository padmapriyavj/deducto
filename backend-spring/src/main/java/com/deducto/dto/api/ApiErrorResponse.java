package com.deducto.dto.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        @JsonProperty("error") String error,
        @JsonProperty("message") String message,
        @JsonProperty("timestamp") String timestamp,
        @JsonProperty("fieldErrors") List<ApiFieldErrorItem> fieldErrors
) {
    public static String nowIso() {
        return Instant.now().toString();
    }

    public static ApiErrorResponse notFound(String message) {
        return new ApiErrorResponse("Not found", message, nowIso(), null);
    }

    public static ApiErrorResponse forbidden() {
        return new ApiErrorResponse("Forbidden", null, nowIso(), null);
    }

    public static ApiErrorResponse validationFailed(List<ApiFieldErrorItem> fieldErrors) {
        return new ApiErrorResponse("Validation failed", null, nowIso(), fieldErrors);
    }

    public static ApiErrorResponse internalError() {
        return new ApiErrorResponse("Internal server error", null, nowIso(), null);
    }

    public static ApiErrorResponse ofStatus(String errorLabel, String message) {
        return new ApiErrorResponse(errorLabel, message, nowIso(), null);
    }

    public static ApiErrorResponse badRequest(String message) {
        return ofStatus("Bad Request", message);
    }

    public static ApiErrorResponse forbiddenWithMessage(String message) {
        return ofStatus("Forbidden", message);
    }

    public static ApiErrorResponse conflict(String message) {
        return ofStatus("Conflict", message);
    }

    public static ApiErrorResponse serviceUnavailable(String message) {
        return ofStatus("Service Unavailable", message);
    }
}
