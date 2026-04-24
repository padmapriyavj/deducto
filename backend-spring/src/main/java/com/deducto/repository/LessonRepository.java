package com.deducto.repository;

import com.deducto.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    @Query("select l from Lesson l join fetch l.course c left join fetch l.material "
            + "where c.id = :courseId order by l.weekNumber asc, l.id asc")
    List<Lesson> findByCourse_IdWithRefsOrderByWeekNumberAndId(@Param("courseId") long courseId);

    @Query("select l from Lesson l join fetch l.course c left join fetch l.material "
            + "where l.id = :id")
    Optional<Lesson> findByIdWithCourseAndMaterial(@Param("id") long id);
}
