package com.deducto.repository;

import com.deducto.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByUser_IdOrderByIdAsc(Long userId);

    List<Enrollment> findByCourse_IdOrderByIdAsc(Long courseId);

    boolean existsByUser_IdAndCourse_Id(Long userId, Long courseId);
}
