package com.deducto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serial;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class UserConceptMasteryId implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "concept_id", nullable = false)
    private Long conceptId;

    public UserConceptMasteryId() {
    }

    public UserConceptMasteryId(Long userId, Long conceptId) {
        this.userId = userId;
        this.conceptId = conceptId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getConceptId() {
        return conceptId;
    }

    public void setConceptId(Long conceptId) {
        this.conceptId = conceptId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        UserConceptMasteryId that = (UserConceptMasteryId) o;
        return Objects.equals(userId, that.userId) && Objects.equals(conceptId, that.conceptId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, conceptId);
    }
}
