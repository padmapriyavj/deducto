package com.deducto.repository;

import com.deducto.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    @Query("select m from Material m join fetch m.course where m.course.id = :courseId order by m.id")
    List<Material> findByCourse_IdWithCourseOrderByIdAsc(@Param("courseId") long courseId);

    @Query("select m from Material m join fetch m.course where m.id = :id")
    Optional<Material> findByIdWithCourse(@Param("id") long id);
}
