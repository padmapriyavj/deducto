package com.deducto.controller;

import com.deducto.dto.auth.AuthResponse;
import com.deducto.dto.auth.ErrorDetailResponse;
import com.deducto.dto.auth.LoginRequest;
import com.deducto.dto.auth.SignupRequest;
import com.deducto.dto.auth.UserResponse;
import com.deducto.entity.User;
import com.deducto.repository.UserRepository;
import com.deducto.security.JwtService;
import com.deducto.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest body) {
        if (userRepository.existsByEmail(body.email().trim().toLowerCase())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(new ErrorDetailResponse("Email already registered"));
        }
        var user = new User();
        String email = body.email().trim().toLowerCase();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(body.password()));
        user.setRole(body.role());
        user.setDisplayName(body.displayName().trim());
        var avatar = new HashMap<String, Object>();
        avatar.put("seed", UUID.randomUUID().toString());
        avatar.put("style", "adventurer");
        user.setAvatarConfig(avatar);
        user.setCoins(0);
        user.setCurrentStreak(0);
        user.setLongestStreak(0);
        user.setStreakFreezes(2);
        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(new ErrorDetailResponse("Email already registered"));
        }
        return ResponseEntity.ok(
                AuthResponse.of(toUserResponse(user), jwtService.createToken(user.getId(), user.getRole()))
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest body) {
        var userOpt = userRepository.findByEmail(body.email().trim().toLowerCase());
        if (userOpt.isEmpty() || !passwordEncoder.matches(body.password(), userOpt.get().getPasswordHash())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorDetailResponse("Invalid credentials"));
        }
        var user = userOpt.get();
        return ResponseEntity.ok(
                AuthResponse.of(toUserResponse(user), jwtService.createToken(user.getId(), user.getRole()))
        );
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return userRepository.findById(principal.id())
                .map(this::toUserResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        return ResponseEntity.ok(Map.of());
    }

    private UserResponse toUserResponse(User u) {
        var avatar = u.getAvatarConfig();
        if (avatar == null) {
            avatar = new HashMap<>();
        }
        return new UserResponse(
                u.getId(),
                u.getEmail(),
                u.getRole().name(),
                u.getDisplayName(),
                avatar,
                u.getCoins(),
                u.getCurrentStreak(),
                u.getLongestStreak(),
                u.getStreakFreezes(),
                u.getCreatedAt()
        );
    }
}
