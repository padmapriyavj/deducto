package com.deducto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Read-only mapping for {@code answers} (FastAPI-owned).
 */
@Entity
@Table(name = "answers")
public class Answer extends BaseEntity {

    @Column(name = "attempt_id", nullable = false)
    private Long attemptId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "selected_choice", nullable = false, length = 8)
    private String selectedChoice;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "time_taken_ms", nullable = false)
    private int timeTakenMs;

    public Long getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(Long attemptId) {
        this.attemptId = attemptId;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getSelectedChoice() {
        return selectedChoice;
    }

    public void setSelectedChoice(String selectedChoice) {
        this.selectedChoice = selectedChoice;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public int getTimeTakenMs() {
        return timeTakenMs;
    }

    public void setTimeTakenMs(int timeTakenMs) {
        this.timeTakenMs = timeTakenMs;
    }
}
