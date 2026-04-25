package com.deducto.dto.dashboard;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record StudentDashboardResponse(
        List<EnrolledCourseSummary> enrolledCourses,
        int currentStreak,
        int coins,
        List<UpcomingTempoItem> upcomingTempos,
        List<RecentAttemptItem> recentAttempts
) {
}
