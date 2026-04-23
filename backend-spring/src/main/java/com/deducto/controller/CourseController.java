package com.deducto.controller;

import com.deducto.dto.auth.ErrorDetailResponse;
import com.deducto.dto.course.CourseResponse;
import com.deducto.dto.course.CreateCourseRequest;
import com.deducto.dto.course.EnrollRequest;
import com.deducto.dto.course.StudentResponse;
import com.deducto.dto.course.UpdateCourseRequest;
import com.deducto.entity.Course;
import com.deducto.entity.Enrollment;
import com.deducto.entity.User;
import com.deducto.entity.UserRole;
import com.deducto.repository.CourseRepository;
import com.deducto.repository.EnrollmentRepository;
import com.deducto.repository.UserRepository;
import com.deducto.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {

    private static final String JOIN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int JOIN_CODE_LENGTH = 8;
    private static final int MAX_JOIN_RETRIES = 20;

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public CourseController(
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository
    ) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> create(
            @Valid @RequestBody CreateCourseRequest body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        if (principal.role() != UserRole.professor) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorDetailResponse("Professor access required"));
        }
        User prof = userRepository.findById(principal.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Map<String, Object> schedule = body.schedule() == null
                ? new HashMap<>()
                : new HashMap<>(body.schedule());

        for (int i = 0; i < MAX_JOIN_RETRIES; i++) {
            var course = new Course();
            course.setProfessor(prof);
            course.setName(body.name().trim());
            course.setDescription(body.description());
            course.setSchedule(schedule);
            course.setJoinCode(randomJoinCode());
            try {
                course = courseRepository.saveAndFlush(course);
                return ResponseEntity.status(HttpStatus.CREATED).body(toCourseResponse(course));
            } catch (DataIntegrityViolationException e) {
                // retry on duplicate join_code
            }
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorDetailResponse("Could not allocate a unique join code"));
    }

    @GetMapping
    public List<CourseResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        if (principal.role() == UserRole.professor) {
            return courseRepository.findByProfessor_IdOrderByIdAsc(principal.id()).stream()
                    .map(this::toCourseResponse)
                    .toList();
        }
        if (principal.role() != UserRole.student) {
            return List.of();
        }
        var enrolls = enrollmentRepository.findByUser_IdOrderByIdAsc(principal.id());
        if (enrolls.isEmpty()) {
            return List.of();
        }
        Set<Long> ids = enrolls.stream().map(e -> e.getCourse().getId()).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return List.of();
        }
        return courseRepository.findByIdInOrderByIdAsc(new ArrayList<>(ids)).stream()
                .map(this::toCourseResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public CourseResponse get(
            @PathVariable("id") long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        var course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (!canView(principal, course)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return toCourseResponse(course);
    }

    @PatchMapping("/{id}")
    public CourseResponse update(
            @PathVariable("id") long id,
            @RequestBody UpdateCourseRequest body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        if (principal.role() != UserRole.professor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the course owner can update");
        }
        var course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (!Objects.equals(course.getProfessor().getId(), principal.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the course owner can update");
        }
        if (body.name() != null) {
            course.setName(body.name().trim());
        }
        if (body.description() != null) {
            course.setDescription(body.description());
        }
        if (body.schedule() != null) {
            course.setSchedule(new HashMap<>(body.schedule()));
        }
        course = courseRepository.saveAndFlush(course);
        return toCourseResponse(course);
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<?> enroll(
            @PathVariable("id") long id,
            @Valid @RequestBody EnrollRequest body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        if (principal.role() != UserRole.student) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorDetailResponse("Student access required"));
        }
        var course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        String want = body.joinCode().strip().toUpperCase();
        String have = course.getJoinCode().strip().toUpperCase();
        if (!want.equals(have)) {
            return ResponseEntity.badRequest().body(new ErrorDetailResponse("Invalid join code"));
        }
        if (enrollmentRepository.existsByUser_IdAndCourse_Id(principal.id(), id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorDetailResponse("Already enrolled in this course"));
        }
        User student = userRepository.getReferenceById(principal.id());
        var en = new Enrollment();
        en.setUser(student);
        en.setCourse(course);
        try {
            enrollmentRepository.saveAndFlush(en);
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorDetailResponse("Already enrolled in this course"));
        }
        return ResponseEntity.ok(toCourseResponse(course));
    }

    @GetMapping("/{id}/students")
    public List<StudentResponse> listStudents(
            @PathVariable("id") long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        if (principal.role() != UserRole.professor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Professor access required");
        }
        var course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (!Objects.equals(course.getProfessor().getId(), principal.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Professor access required");
        }
        var enrolls = enrollmentRepository.findByCourse_IdOrderByIdAsc(id);
        if (enrolls.isEmpty()) {
            return List.of();
        }
        var userIds = enrolls.stream().map(e -> e.getUser().getId()).toList();
        return userRepository.findAllById(new ArrayList<>(userIds)).stream()
                .map(this::toStudentResponse)
                .toList();
    }

    private static void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
    }

    private boolean canView(UserPrincipal principal, Course course) {
        if (Objects.equals(course.getProfessor().getId(), principal.id())) {
            return true;
        }
        return enrollmentRepository.existsByUser_IdAndCourse_Id(principal.id(), course.getId());
    }

    private CourseResponse toCourseResponse(Course c) {
        var sched = c.getSchedule();
        if (sched == null) {
            sched = new HashMap<>();
        }
        return new CourseResponse(
                c.getId(),
                c.getProfessorId(),
                c.getName(),
                c.getDescription(),
                sched,
                c.getJoinCode(),
                c.getCreatedAt()
        );
    }

    private StudentResponse toStudentResponse(User u) {
        var avatar = u.getAvatarConfig();
        if (avatar == null) {
            avatar = new HashMap<>();
        }
        return new StudentResponse(
                u.getId(),
                u.getEmail(),
                u.getDisplayName(),
                avatar,
                u.getCoins(),
                u.getCurrentStreak()
        );
    }

    private static String randomJoinCode() {
        var r = ThreadLocalRandom.current();
        var sb = new StringBuilder(JOIN_CODE_LENGTH);
        for (int i = 0; i < JOIN_CODE_LENGTH; i++) {
            sb.append(JOIN_ALPHABET.charAt(r.nextInt(JOIN_ALPHABET.length())));
        }
        return sb.toString();
    }
}
