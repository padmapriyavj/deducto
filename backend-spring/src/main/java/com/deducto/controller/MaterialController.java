package com.deducto.controller;

import com.deducto.dto.api.ApiErrorResponse;
import com.deducto.dto.material.MaterialResponse;
import com.deducto.entity.Course;
import com.deducto.entity.UserRole;
import com.deducto.repository.CourseRepository;
import com.deducto.repository.EnrollmentRepository;
import com.deducto.repository.LessonRepository;
import com.deducto.repository.MaterialRepository;
import com.deducto.security.UserPrincipal;
import com.deducto.service.MaterialIngestionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Objects;

@RestController
public class MaterialController {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final MaterialRepository materialRepository;
    private final LessonRepository lessonRepository;
    private final MaterialIngestionService materialIngestionService;

    public MaterialController(
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            MaterialRepository materialRepository,
            LessonRepository lessonRepository,
            MaterialIngestionService materialIngestionService
    ) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.materialRepository = materialRepository;
        this.lessonRepository = lessonRepository;
        this.materialIngestionService = materialIngestionService;
    }

    @PostMapping("/api/v1/courses/{courseId}/materials")
    public ResponseEntity<?> upload(
            @PathVariable("courseId") long courseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "lesson_id", required = false) Long lessonId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        if (principal.role() != UserRole.professor) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiErrorResponse.forbiddenWithMessage("Professor access required"));
        }
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NoSuchElementException("Course not found: " + courseId));
        if (!Objects.equals(course.getProfessor().getId(), principal.id())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiErrorResponse.forbiddenWithMessage("Only the course owner can upload materials"));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiErrorResponse.badRequest("file is required"));
        }
        try {
            MaterialResponse body = materialIngestionService.createForCourse(course, file, description);
            if (lessonId != null) {
                linkMaterialToLesson(courseId, principal, lessonId, body.id());
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(body);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiErrorResponse.badRequest(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiErrorResponse.ofStatus("Internal server error", "Could not read upload: " + e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiErrorResponse.serviceUnavailable(e.getMessage()));
        }
    }

    @GetMapping("/api/v1/courses/{courseId}/materials")
    public List<MaterialResponse> listForCourse(
            @PathVariable("courseId") long courseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NoSuchElementException("Course not found: " + courseId));
        if (!canViewCourse(principal, course)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        var materials = materialRepository.findByCourse_IdWithCourseOrderByIdAsc(courseId);
        return materialIngestionService.toResponseList(materials);
    }

    @GetMapping("/api/v1/materials/{id}")
    public MaterialResponse getById(
            @PathVariable("id") long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        var material = materialRepository.findByIdWithCourse(id)
                .orElseThrow(() -> new NoSuchElementException("Material not found: " + id));
        if (!canViewCourse(principal, material.getCourse())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return materialIngestionService.toResponse(material);
    }

    @DeleteMapping("/api/v1/materials/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable("id") long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        if (principal.role() != UserRole.professor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Professor access required");
        }
        var material = materialRepository.findByIdWithCourse(id)
                .orElseThrow(() -> new NoSuchElementException("Material not found: " + id));
        var course = material.getCourse();
        if (!Objects.equals(course.getProfessor().getId(), principal.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the course owner can delete materials");
        }
        materialIngestionService.deleteMaterialById(id);
    }

    /**
     * After upload, attach the new material row to a lesson in the same course (same as PATCH lesson
     * with material_id; used by the create-lesson flow with ?lesson_id= on multipart upload).
     */
    private void linkMaterialToLesson(
            long courseId,
            UserPrincipal principal,
            long lessonId,
            long newMaterialId
    ) {
        var lesson = lessonRepository.findByIdWithCourseAndMaterial(lessonId)
                .orElseThrow(() -> new NoSuchElementException("Lesson not found: " + lessonId));
        if (!Objects.equals(lesson.getCourse().getId(), courseId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Lesson does not belong to this course");
        }
        if (!Objects.equals(lesson.getCourse().getProfessor().getId(), principal.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the course owner can link materials");
        }
        var mat = materialRepository.findByIdWithCourse(newMaterialId)
                .orElseThrow(() -> new NoSuchElementException("Material not found: " + newMaterialId));
        if (!Objects.equals(mat.getCourse().getId(), courseId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Material does not belong to this course");
        }
        lesson.setMaterial(materialRepository.getReferenceById(newMaterialId));
        lessonRepository.saveAndFlush(lesson);
    }

    private static void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
    }

    private boolean canViewCourse(UserPrincipal principal, Course course) {
        if (Objects.equals(course.getProfessor().getId(), principal.id())) {
            return true;
        }
        return enrollmentRepository.existsByUser_IdAndCourse_Id(principal.id(), course.getId());
    }
}
