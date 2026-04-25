package com.deducto.repository;

import com.deducto.entity.QuizAttempt;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByUserIdOrderByStartedAtDesc(Long userId, Pageable pageable);

    @Query(
            "select count(a) from QuizAttempt a, Quiz q where a.quizId = q.id and a.userId = :userId "
                    + "and a.completedAt is not null and q.courseId = :courseId")
    long countCompletedByUserAndCourseId(
            @Param("userId") Long userId, @Param("courseId") Long courseId);

    /**
     * @return total coins (may exceed {@link Integer#MAX_VALUE} in theory; service clamps to int for DTOs)
     */
    @Query(
            "select coalesce(sum(a.coinsEarned), 0) from QuizAttempt a, Quiz q where a.quizId = q.id "
                    + "and a.userId = :userId and a.completedAt is not null and q.courseId = :courseId")
    Long sumCoinsEarnedByUserAndCourseId(
            @Param("userId") Long userId, @Param("courseId") Long courseId);
}
