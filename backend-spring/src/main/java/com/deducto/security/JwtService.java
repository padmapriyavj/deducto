package com.deducto.security;

import com.deducto.entity.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_ROLE = "role";

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${security.jwt.secret-key}") String rawSecret,
            @Value("${security.jwt.expiration-ms}") long expirationMs
    ) {
        this.signingKey = hmacKeyFromString(rawSecret);
        this.expirationMs = expirationMs;
    }

    public String createToken(long userId, UserRole role) {
        var now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(CLAIM_USER_ID, userId)
                .claim(CLAIM_ROLE, role.name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(signingKey)
                .compact();
    }

    public Optional<JwtPrincipalClaims> parseAndValidate(String token) {
        try {
            var parsed = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);
            Claims claims = parsed.getPayload();
            long userId = readUserId(claims);
            if (userId <= 0) {
                return Optional.empty();
            }
            String roleName = claims.get(CLAIM_ROLE, String.class);
            if (roleName == null) {
                return Optional.empty();
            }
            return Optional.of(new JwtPrincipalClaims(
                    userId,
                    UserRole.valueOf(roleName)
            ));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private long readUserId(Claims claims) {
        Object raw = claims.get(CLAIM_USER_ID);
        if (raw instanceof Number n) {
            return n.longValue();
        }
        String sub = claims.getSubject();
        if (sub != null) {
            try {
                return Long.parseLong(sub);
            } catch (NumberFormatException e) {
                return -1L;
            }
        }
        return -1L;
    }

    private static SecretKey hmacKeyFromString(String rawSecret) {
        return Keys.hmacShaKeyFor(sha256Bytes(rawSecret));
    }

    private static byte[] sha256Bytes(String s) {
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(s.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public record JwtPrincipalClaims(long userId, UserRole role) {}
}
