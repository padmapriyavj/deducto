package com.deducto.repository;

import com.deducto.entity.Concept;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConceptRepository extends JpaRepository<Concept, Long> {

    List<Concept> findByLesson_IdOrderByIdAsc(long lessonId);

    @Modifying
    @Query("delete from Concept c where c.lesson.id = :lessonId")
    void deleteByLesson_Id(@Param("lessonId") long lessonId);
}
