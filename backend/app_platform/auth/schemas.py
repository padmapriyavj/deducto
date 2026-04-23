from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    display_name: str
    role: Literal["student", "professor"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    email: str
    role: str
    display_name: str
    avatar_config: dict[str, Any]
    coins: int
    current_streak: int
    longest_streak: int
    streak_freezes: int
    created_at: datetime


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"


class UserUpdateBody(BaseModel):
    display_name: str | None = None
    avatar_config: dict[str, Any] | None = None
