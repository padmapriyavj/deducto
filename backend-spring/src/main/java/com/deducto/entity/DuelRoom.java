package com.deducto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Read-only mapping for {@code duel_rooms}; PK is a String room id (no {@link BaseEntity}).
 */
@Entity
@Table(name = "duel_rooms")
public class DuelRoom {

    @Id
    @Column(name = "id", nullable = false, length = 128)
    private String id;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "host_user_id", nullable = false)
    private Long hostUserId;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public Long getHostUserId() {
        return hostUserId;
    }

    public void setHostUserId(Long hostUserId) {
        this.hostUserId = hostUserId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
