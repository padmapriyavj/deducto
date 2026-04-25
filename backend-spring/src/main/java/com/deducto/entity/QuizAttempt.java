package com.deducto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Read-only mapping for {@code quiz_attempts} (FastAPI-owned); Spring may update
 * coins on {@link User} and persist {@link UserInventory} in shop flow only.
 */
@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt extends BaseEntity {

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "room_id", length = 128)
    private String roomId;

    @Column(name = "mode", nullable = false, length = 32)
    private String mode;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "score_pct", precision = 6, scale = 2)
    private BigDecimal scorePct;

    @Column(name = "coins_earned")
    private Integer coinsEarned;

    @Column(name = "betcha_multiplier", length = 32)
    private String betchaMultiplier;

    @Column(name = "betcha_resolved", nullable = false)
    private boolean betchaResolved;

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public OffsetDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(OffsetDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(OffsetDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public BigDecimal getScorePct() {
        return scorePct;
    }

    public void setScorePct(BigDecimal scorePct) {
        this.scorePct = scorePct;
    }

    public Integer getCoinsEarned() {
        return coinsEarned;
    }

    public void setCoinsEarned(Integer coinsEarned) {
        this.coinsEarned = coinsEarned;
    }

    public String getBetchaMultiplier() {
        return betchaMultiplier;
    }

    public void setBetchaMultiplier(String betchaMultiplier) {
        this.betchaMultiplier = betchaMultiplier;
    }

    public boolean isBetchaResolved() {
        return betchaResolved;
    }

    public void setBetchaResolved(boolean betchaResolved) {
        this.betchaResolved = betchaResolved;
    }
}
