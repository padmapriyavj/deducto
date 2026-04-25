package com.deducto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

/**
 * Read-only mapping for {@code quizzes} (FastAPI-owned).
 */
@Entity
@Table(name = "quizzes")
public class Quiz extends BaseEntity {

    @Column(name = "type", nullable = false, length = 32)
    private String type;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "lesson_id")
    private Long lessonId;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "config", columnDefinition = "jsonb", nullable = false)
    private String config;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "duration_sec")
    private Integer durationSec;

    @Column(name = "scheduled_at")
    private OffsetDateTime scheduledAt;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public String getConfig() {
        return config;
    }

    public void setConfig(String config) {
        this.config = config;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getDurationSec() {
        return durationSec;
    }

    public void setDurationSec(Integer durationSec) {
        this.durationSec = durationSec;
    }

    public OffsetDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(OffsetDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }
}
