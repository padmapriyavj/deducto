package com.deducto.controller;

import com.deducto.dto.dashboard.LeaderboardEntry;
import com.deducto.security.UserPrincipal;
import com.deducto.service.DashboardService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leaderboard")
public class LeaderboardController {

    private final DashboardService dashboardService;

    public LeaderboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/{courseId}")
    public List<LeaderboardEntry> get(
            @PathVariable long courseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireAuth(principal);
        return dashboardService.leaderboard(courseId, principal.id());
    }

    private static void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
    }
}
