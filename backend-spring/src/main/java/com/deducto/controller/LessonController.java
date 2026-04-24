package com.deducto.controller;

import com.deducto.dto.auth.ErrorDetailResponse;
import com.deducto.dto.lesson.CreateLessonRequest;
import com.deducto.dto.lesson.LessonResponse;
import com.deducto.dto.lesson.UpdateLessonRequest;
import com.deducto.entity.Course;
import com.deducto.entity.Lesson;
import com.deducto.entity.UserRole;
import com.deducto.repository.CourseRepository;
import com.deducto.repository.EnrollmentRepository;
import com.deducto.repository.LessonRepository;
import com.deducto.repository.MaterialRepository;
import com.deducto.security.UserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@RestController
public class LessonController {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final MaterialRepository materialRepository;
    private final ObjectMapper objectMapper;

    public LessonController(
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            LessonRepository lessonRepository,
            MaterialRepository materialRepository,
            ObjectMapper objectMapper
    ) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.lessonRepository = lessonRepository;
        this.materialRepository = materialRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/api/v1/courses/{courseId}/lessons")
    @Transactional
    public ResponseEntity<?> create(
            @PathVariable("courseId") long courseId,
            @Valid @RequestBody CreateLessonRequest body,
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
                    .body(new ErrorDetailResponse("Only the course owner can create lessons"));
        }
        if (body.materialId() != null) {
            assertMaterialInCourse(body.materialId(), courseId);
        }
        var lesson = new Lesson();
        lesson.setCourse(course);
        lesson.setTitle(body.title().trim());
        lesson.setWeekNumber(body.weekNumber());
        lesson.setSources(parseSourcesString(body.sources()));
        if (body.materialId() != null) {
            lesson.setMaterial(materialRepository.getReferenceById(body.materialId()));
        }
        lesson = lessonRepository.saveAndFlush(lesson);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(lesson));
    }

    @GetMapping("/api/v1/courses/{courseId}/lessons")
    public List<LessonResponse> listForCourse(
            @PathVariable("courseId") long courseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (!canViewCourse(principal, course)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return lessonRepository.findByCourse_IdWithRefsOrderByWeekNumberAndId(courseId).stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/api/v1/lessons/{id}")
    public LessonResponse getById(
            @PathVariable("id") long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        var lesson = lessonRepository.findByIdWithCourseAndMaterial(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        if (!canViewCourse(principal, lesson.getCourse())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return toResponse(lesson);
    }

    @PatchMapping("/api/v1/lessons/{id}")
    @Transactional
    public ResponseEntity<?> update(
            @PathVariable("id") long id,
            @RequestBody UpdateLessonRequest body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        if (principal.role() != UserRole.professor) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorDetailResponse("Professor access required"));
        }
        var lesson = lessonRepository.findByIdWithCourseAndMaterial(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        long courseId = lesson.getCourse().getId();
        if (!Objects.equals(lesson.getCourse().getProfessor().getId(), principal.id())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorDetailResponse("Only the course owner can update lessons"));
        }
        if (body.title() != null) {
            lesson.setTitle(body.title().trim());
        }
        if (body.weekNumber() != null) {
            if (body.weekNumber() <= 0) {
                return ResponseEntity.badRequest().body(new ErrorDetailResponse("week_number must be positive"));
            }
            lesson.setWeekNumber(body.weekNumber());
        }
        if (body.materialId() != null) {
            assertMaterialInCourse(body.materialId(), courseId);
            lesson.setMaterial(materialRepository.getReferenceById(body.materialId()));
        }
        if (body.sources() != null) {
            lesson.setSources(parseSourcesString(body.sources()));
        }
        lesson = lessonRepository.saveAndFlush(lesson);
        return ResponseEntity.ok(toResponse(lesson));
    }

    private void assertMaterialInCourse(long materialId, long courseId) {
        var m = materialRepository.findByIdWithCourse(materialId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found"));
        if (!Objects.equals(m.getCourse().getId(), courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Material does not belong to this course");
        }
    }

    private JsonNode parseSourcesString(String sources) {
        if (sources == null || sources.isBlank()) {
            return objectMapper.createArrayNode();
        }
        try {
            JsonNode n = objectMapper.readTree(sources);
            if (!n.isArray()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sources must be a JSON array");
            }
            return n;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON in sources");
        }
    }

    private LessonResponse toResponse(Lesson l) {
        JsonNode src = l.getSources() != null ? l.getSources() : objectMapper.createArrayNode();
        return new LessonResponse(
                l.getId(),
                l.getCourse().getId(),
                l.getTitle(),
                l.getWeekNumber(),
                l.getMaterialId(),
                src,
                l.getCreatedAt(),
                l.getUpdatedAt()
        );
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
