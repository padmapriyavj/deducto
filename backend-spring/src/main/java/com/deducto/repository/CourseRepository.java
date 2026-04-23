package com.deducto.repository;

import com.deducto.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByProfessor_IdOrderByIdAsc(Long professorId);

    List<Course> findByIdInOrderByIdAsc(Collection<Long> ids);
}
