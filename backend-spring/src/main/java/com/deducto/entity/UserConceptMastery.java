package com.deducto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * Read-only mapping for {@code user_concept_mastery} (FastAPI-owned composite PK).
 */
@Entity
@Table(name = "user_concept_mastery")
public class UserConceptMastery {

    @EmbeddedId
    private UserConceptMasteryId id;

    @Column(name = "attempts", nullable = false)
    private int attempts;

    @Column(name = "correct", nullable = false)
    private int correct;

    @Column(name = "mastery_score", nullable = false, precision = 6, scale = 2)
    private BigDecimal masteryScore;

    public UserConceptMasteryId getId() {
        return id;
    }

    public void setId(UserConceptMasteryId id) {
        this.id = id;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public int getCorrect() {
        return correct;
    }

    public void setCorrect(int correct) {
        this.correct = correct;
    }

    public BigDecimal getMasteryScore() {
        return masteryScore;
    }

    public void setMasteryScore(BigDecimal masteryScore) {
        this.masteryScore = masteryScore;
    }
}
