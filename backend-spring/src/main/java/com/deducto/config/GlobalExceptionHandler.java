package com.deducto.config;

import com.deducto.dto.api.ApiErrorResponse;
import com.deducto.dto.api.ApiFieldErrorItem;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({NoSuchElementException.class, EntityNotFoundException.class})
    public ResponseEntity<ApiErrorResponse> handleNotFound(Exception ex) {
        String message = ex.getMessage() != null && !ex.getMessage().isBlank()
                ? ex.getMessage()
                : "Not found";
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiErrorResponse.notFound(message));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied() {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiErrorResponse.forbidden());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        var list = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiFieldErrorItem(
                        fe.getField(),
                        fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value"
                ))
                .toList();
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.validationFailed(list));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleNotReadable() {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.ofStatus("Bad Request", "Invalid request body"));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiErrorResponse> onDataAccess(DataAccessException ex) {
        return dataAccessError(ex);
    }

    @ExceptionHandler(PersistenceException.class)
    public ResponseEntity<ApiErrorResponse> onJpa(PersistenceException ex) {
        return dataAccessError(ex);
    }

    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<ApiErrorResponse> onTx(TransactionSystemException ex) {
        return dataAccessError(ex);
    }

    private static ResponseEntity<ApiErrorResponse> dataAccessError(Exception ex) {
        log.error("Database or transaction error", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiErrorResponse.internalError());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        int code = ex.getStatusCode().value();
        String reason = ex.getReason() != null && !ex.getReason().isBlank() ? ex.getReason() : null;
        if (code == 403) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiErrorResponse.forbidden());
        }
        if (code == 404) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiErrorResponse.notFound(reason != null ? reason : "Not found"));
        }
        if (code == 401) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    new ApiErrorResponse("Unauthorized", reason, ApiErrorResponse.nowIso(), null));
        }
        if (code >= 500) {
            log.warn("ResponseStatusException {}: {}", code, ex.getMessage());
        }
        String errorLabel = mapStatusToErrorLabel(code);
        return ResponseEntity.status(ex.getStatusCode())
                .body(new ApiErrorResponse(errorLabel, reason, ApiErrorResponse.nowIso(), null));
    }

    private static String mapStatusToErrorLabel(int value) {
        return switch (value) {
            case 400 -> "Bad Request";
            case 401 -> "Unauthorized";
            case 403 -> "Forbidden";
            case 404 -> "Not found";
            case 409 -> "Conflict";
            case 502 -> "Bad Gateway";
            case 503 -> "Service Unavailable";
            default -> "Error";
        };
    }

    /**
     * Catch-all for unexpected runtime problems. Do not use {@link Exception} here — that would
     * swallow Spring MVC’s handling of {@link jakarta.servlet.ServletException} and similar (e.g. 405).
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiErrorResponse> handleRuntime(RuntimeException ex) {
        log.error("Unhandled error", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiErrorResponse.internalError());
    }
}
