package com.deducto.config;

import com.deducto.dto.auth.ErrorDetailResponse;
import jakarta.persistence.PersistenceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Objects;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorDetailResponse> onDataAccess(DataAccessException ex) {
        return dataAccessError(ex);
    }

    @ExceptionHandler(PersistenceException.class)
    public ResponseEntity<ErrorDetailResponse> onJpa(PersistenceException ex) {
        return dataAccessError(ex);
    }

    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<ErrorDetailResponse> onTx(TransactionSystemException ex) {
        return dataAccessError(ex);
    }

    private static ResponseEntity<ErrorDetailResponse> dataAccessError(Exception ex) {
        log.error("Database or transaction error", ex);
        Throwable specific = NestedExceptionUtils.getMostSpecificCause(ex);
        String msg = specific.getMessage() != null && !specific.getMessage().isBlank()
                ? specific.getMessage()
                : ex.getMessage();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorDetailResponse(Objects.toString(msg, "Database error")));
    }
}
