package com.deducto.controller;

import com.deducto.dto.auth.ErrorDetailResponse;
import com.deducto.dto.material.MaterialResponse;
import com.deducto.entity.Course;
import com.deducto.entity.UserRole;
import com.deducto.repository.CourseRepository;
import com.deducto.repository.EnrollmentRepository;
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
import java.util.Objects;

@RestController
public class MaterialController {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final MaterialRepository materialRepository;
    private final MaterialIngestionService materialIngestionService;

    public MaterialController(
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            MaterialRepository materialRepository,
            MaterialIngestionService materialIngestionService
    ) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.materialRepository = materialRepository;
        this.materialIngestionService = materialIngestionService;
    }

    @PostMapping("/api/v1/courses/{courseId}/materials")
    public ResponseEntity<?> upload(
            @PathVariable("courseId") long courseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        if (principal.role() != UserRole.professor) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorDetailResponse("Professor access required"));
        }
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (!Objects.equals(course.getProfessor().getId(), principal.id())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorDetailResponse("Only the course owner can upload materials"));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(new ErrorDetailResponse("file is required"));
        }
        try {
            MaterialResponse body = materialIngestionService.createForCourse(course, file, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(body);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorDetailResponse(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorDetailResponse("Could not read upload: " + e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorDetailResponse(e.getMessage()));
        }
    }

    @GetMapping("/api/v1/courses/{courseId}/materials")
    public List<MaterialResponse> listForCourse(
            @PathVariable("courseId") long courseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found"));
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found"));
        var course = material.getCourse();
        if (!Objects.equals(course.getProfessor().getId(), principal.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the course owner can delete materials");
        }
        materialIngestionService.deleteMaterialById(id);
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
