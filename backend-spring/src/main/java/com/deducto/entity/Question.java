package com.deducto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Read-only mapping for {@code questions} (FastAPI-owned).
 */
@Entity
@Table(name = "questions")
public class Question extends BaseEntity {

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "question_order", nullable = false)
    private int questionOrder;

    @Column(name = "text", columnDefinition = "text", nullable = false)
    private String text;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "choices", columnDefinition = "jsonb", nullable = false)
    private String choices;

    @Column(name = "correct_choice", nullable = false, length = 8)
    private String correctChoice;

    @Column(name = "concept_id", nullable = false)
    private Long conceptId;

    @Column(name = "difficulty", nullable = false, length = 16)
    private String difficulty;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "generation_metadata", columnDefinition = "jsonb", nullable = false)
    private String generationMetadata;

    @Column(name = "approved", nullable = false)
    private boolean approved;

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public int getQuestionOrder() {
        return questionOrder;
    }

    public void setQuestionOrder(int questionOrder) {
        this.questionOrder = questionOrder;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getChoices() {
        return choices;
    }

    public void setChoices(String choices) {
        this.choices = choices;
    }

    public String getCorrectChoice() {
        return correctChoice;
    }

    public void setCorrectChoice(String correctChoice) {
        this.correctChoice = correctChoice;
    }

    public Long getConceptId() {
        return conceptId;
    }

    public void setConceptId(Long conceptId) {
        this.conceptId = conceptId;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getGenerationMetadata() {
        return generationMetadata;
    }

    public void setGenerationMetadata(String generationMetadata) {
        this.generationMetadata = generationMetadata;
    }

    public boolean isApproved() {
        return approved;
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }
}
