package com.deducto.entity;

/**
 * Lowercase to match Postgres {@code processing_status} enum.
 */
public enum ProcessingStatus {
    pending,
    processing,
    ready,
    failed
}
