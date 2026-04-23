package com.deducto.security;

import com.deducto.entity.UserRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String AUTHORIZATION = "Authorization";
    public static final String BEARER = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader(AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER)) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = header.substring(BEARER.length());
        var parsed = jwtService.parseAndValidate(token);
        if (parsed.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }
        var claims = parsed.get();
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            var principal = new UserPrincipal(claims.userId(), claims.role());
            var auth = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    toAuthorities(claims.role())
            );
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        filterChain.doFilter(request, response);
    }

    private static List<org.springframework.security.core.authority.SimpleGrantedAuthority> toAuthorities(
            UserRole role
    ) {
        return List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"));
    }
}
