package com.deducto.repository;

import com.deducto.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

/**
 * The {@code quizzes} table uses PostgreSQL enum columns ({@code quiz_status} etc.); bind parameters
 * as {@code varchar} do not match enum equality in PostgreSQL, so we compare via {@code ::text}.
 */
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    @Query(
            value = "SELECT COUNT(*) FROM quizzes WHERE course_id = :courseId AND status::text = :status",
            nativeQuery = true
    )
    long countByCourseIdAndStatus(
            @Param("courseId") long courseId,
            @Param("status") String status
    );

    @Query(
            value = "SELECT * FROM quizzes q "
                    + "WHERE q.type::text = 'tempo' AND q.status::text = 'published' AND q.scheduled_at IS NOT NULL"
                    + " AND q.scheduled_at > :now AND q.course_id IN (:courseIds) "
                    + "ORDER BY q.scheduled_at ASC LIMIT :limit",
            nativeQuery = true
    )
    List<Quiz> findUpcomingTempos(
            @Param("now") OffsetDateTime now,
            @Param("courseIds") Collection<Long> courseIds,
            @Param("limit") int limit
    );
}
