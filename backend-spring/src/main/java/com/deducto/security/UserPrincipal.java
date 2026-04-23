package com.deducto.security;

import com.deducto.entity.UserRole;

import java.util.Objects;

public final class UserPrincipal {

    private final long id;
    private final UserRole role;

    public UserPrincipal(long id, UserRole role) {
        this.id = id;
        this.role = Objects.requireNonNull(role);
    }

    public long id() {
        return id;
    }

    public UserRole role() {
        return role;
    }
}
