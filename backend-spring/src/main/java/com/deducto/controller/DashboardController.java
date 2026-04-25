package com.deducto.controller;

import com.deducto.dto.api.ApiErrorResponse;
import com.deducto.dto.dashboard.ProfessorDashboardResponse;
import com.deducto.dto.dashboard.StudentDashboardResponse;
import com.deducto.entity.UserRole;
import com.deducto.security.UserPrincipal;
import com.deducto.service.DashboardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/student")
    public ResponseEntity<?> student(@AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        if (principal.role() != UserRole.student) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiErrorResponse.forbiddenWithMessage("Student access required"));
        }
        StudentDashboardResponse body = dashboardService.studentDashboard(principal.id());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/professor")
    public ResponseEntity<?> professor(@AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        if (principal.role() != UserRole.professor) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiErrorResponse.forbiddenWithMessage("Professor access required"));
        }
        ProfessorDashboardResponse body = dashboardService.professorDashboard(principal.id());
        return ResponseEntity.ok(body);
    }

    private static void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
    }
}
