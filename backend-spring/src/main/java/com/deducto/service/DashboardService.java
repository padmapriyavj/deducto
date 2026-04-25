package com.deducto.service;

import com.deducto.dto.dashboard.EnrolledCourseSummary;
import com.deducto.dto.dashboard.LeaderboardEntry;
import com.deducto.dto.dashboard.ProfessorCourseRow;
import com.deducto.dto.dashboard.ProfessorDashboardResponse;
import com.deducto.dto.dashboard.RecentAttemptItem;
import com.deducto.dto.dashboard.StudentDashboardResponse;
import com.deducto.dto.dashboard.UpcomingTempoItem;
import com.deducto.entity.Course;
import com.deducto.entity.Enrollment;
import com.deducto.entity.Quiz;
import com.deducto.entity.QuizAttempt;
import com.deducto.entity.User;
import com.deducto.repository.ConceptRepository;
import com.deducto.repository.CourseRepository;
import com.deducto.repository.EnrollmentRepository;
import com.deducto.repository.QuizAttemptRepository;
import com.deducto.repository.QuizRepository;
import com.deducto.repository.UserConceptMasteryRepository;
import com.deducto.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final int UPCOMING_TEMPOS_LIMIT = 3;
    private static final int RECENT_ATTEMPTS_LIMIT = 5;
    private static final int LEADERBOARD_LIMIT = 10;

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ConceptRepository conceptRepository;
    private final UserConceptMasteryRepository userConceptMasteryRepository;

    public DashboardService(
            EnrollmentRepository enrollmentRepository,
            CourseRepository courseRepository,
            UserRepository userRepository,
            QuizRepository quizRepository,
            QuizAttemptRepository quizAttemptRepository,
            ConceptRepository conceptRepository,
            UserConceptMasteryRepository userConceptMasteryRepository
    ) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.conceptRepository = conceptRepository;
        this.userConceptMasteryRepository = userConceptMasteryRepository;
    }

    public StudentDashboardResponse studentDashboard(long userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        var enrollments = enrollmentRepository.findByUser_IdOrderByIdAsc(userId);
        var enrolled = enrollments.stream()
                .map(Enrollment::getCourse)
                .map(c -> {
                    long cid = c.getId();
                    long nDone = quizAttemptRepository.countCompletedByUserAndCourseId(userId, cid);
                    int tests = (int) Math.min(Integer.MAX_VALUE, nDone);
                    Long sumCoins = quizAttemptRepository.sumCoinsEarnedByUserAndCourseId(userId, cid);
                    long rawCoins = sumCoins != null ? sumCoins : 0L;
                    int coins = (int) Math.min(Integer.MAX_VALUE, rawCoins);
                    return new EnrolledCourseSummary(
                            cid,
                            c.getName(),
                            c.getJoinCode(),
                            c.getDescription() != null ? c.getDescription() : "",
                            tests,
                            coins
                    );
                })
                .toList();

        var courseIds = enrollments.stream()
                .map(e -> e.getCourse().getId())
                .collect(Collectors.toList());

        var upcoming = new ArrayList<UpcomingTempoItem>();
        if (!courseIds.isEmpty()) {
            var now = OffsetDateTime.now();
            List<Quiz> tempos = quizRepository.findUpcomingTempos(now, courseIds, UPCOMING_TEMPOS_LIMIT);
            for (Quiz q : tempos) {
                upcoming.add(toUpcomingTempo(q));
            }
        }

        var pageAttempts = PageRequest.of(0, RECENT_ATTEMPTS_LIMIT);
        var attempts = quizAttemptRepository.findByUserIdOrderByStartedAtDesc(userId, pageAttempts);
        var recent = attempts.stream()
                .map(this::toRecentAttempt)
                .toList();

        return new StudentDashboardResponse(
                enrolled,
                u.getCurrentStreak(),
                u.getCoins(),
                upcoming,
                recent
        );
    }

    public ProfessorDashboardResponse professorDashboard(long professorId) {
        List<Course> courses = courseRepository.findByProfessor_IdOrderByIdAsc(professorId);
        var rows = new ArrayList<ProfessorCourseRow>();
        for (Course c : courses) {
            long courseId = c.getId();
            int studentCount = enrollmentRepository.findByCourse_IdOrderByIdAsc(courseId).size();
            long pub = quizRepository.countByCourseIdAndStatus(courseId, "published");
            int published = pub > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) pub;
            double avgMastery = averageMasteryForCourse(courseId);
            rows.add(new ProfessorCourseRow(
                    courseId,
                    c.getName(),
                    studentCount,
                    published,
                    avgMastery
            ));
        }
        return new ProfessorDashboardResponse(rows);
    }

    private double averageMasteryForCourse(long courseId) {
        List<Long> conceptIds = conceptRepository.findIdsByCourseId(courseId);
        if (conceptIds.isEmpty()) {
            return 0.0;
        }
        Object raw = userConceptMasteryRepository.averageMasteryScoreByConceptIdIn(conceptIds);
        if (raw == null) {
            return 0.0;
        }
        if (raw instanceof Number n) {
            return n.doubleValue();
        }
        return 0.0;
    }

    public List<LeaderboardEntry> leaderboard(long courseId, long currentUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NoSuchElementException("Course not found"));
        if (!canAccessCourseLeaderboard(currentUserId, course)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to view this leaderboard");
        }
        var enr = enrollmentRepository.findByCourse_IdOrderByIdAsc(courseId);
        var userIds = enr.stream()
                .map(e -> e.getUser().getId())
                .toList();
        if (userIds.isEmpty()) {
            return List.of();
        }
        var page = PageRequest.of(0, LEADERBOARD_LIMIT);
        var users = userRepository.findByIdInOrderByCoinsDesc(userIds, page);
        return users.stream()
                .map(u -> new LeaderboardEntry(u.getDisplayName(), u.getCoins(), u.getCurrentStreak()))
                .toList();
    }

    private boolean canAccessCourseLeaderboard(long userId, Course course) {
        if (course.getProfessor() != null && course.getProfessor().getId() == userId) {
            return true;
        }
        return enrollmentRepository.existsByUser_IdAndCourse_Id(userId, course.getId());
    }

    private static UpcomingTempoItem toUpcomingTempo(Quiz q) {
        String sat = null;
        if (q.getScheduledAt() != null) {
            sat = q.getScheduledAt().toString();
        }
        return new UpcomingTempoItem(
                q.getId(),
                q.getCourseId(),
                q.getLessonId(),
                q.getType(),
                q.getStatus(),
                q.getDurationSec(),
                sat
        );
    }

    private RecentAttemptItem toRecentAttempt(QuizAttempt a) {
        String started = a.getStartedAt() != null ? a.getStartedAt().toString() : null;
        String completed = a.getCompletedAt() != null ? a.getCompletedAt().toString() : null;
        Double score = null;
        if (a.getScorePct() != null) {
            score = a.getScorePct().doubleValue();
        }
        return new RecentAttemptItem(
                a.getId(),
                a.getQuizId(),
                started,
                completed,
                score,
                a.getCoinsEarned()
        );
    }
}
