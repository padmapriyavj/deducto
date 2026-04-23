import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from postgrest.exceptions import APIError

from database import get_supabase
from models.user import User

from .dependencies import get_current_user
from .schemas import AuthResponse, LoginRequest, SignupRequest, UserResponse, UserUpdateBody
from .security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

_USER_PUBLIC_COLUMNS = (
    "id,email,role,display_name,avatar_config,coins,current_streak,longest_streak,"
    "streak_freezes,created_at"
)


@router.post("/signup", response_model=AuthResponse)
def signup(body: SignupRequest) -> AuthResponse:
    sb = get_supabase()
    email = str(body.email)
    existing = sb.table("users").select("id").eq("email", email).limit(1).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    avatar_config = {"seed": str(uuid.uuid4()), "style": "adventurer"}
    try:
        inserted = sb.table("users").insert(
            {
                "email": email,
                "password_hash": hash_password(body.password),
                "role": body.role,
                "display_name": body.display_name,
                "avatar_config": avatar_config,
            }
        ).execute()
    except APIError as e:
        err = str(e).lower()
        if "duplicate" in err or "unique" in err or "23505" in err:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
            ) from e
        raise

    if not inserted.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User creation failed",
        )
    row = inserted.data[0]
    public = {k: v for k, v in row.items() if k != "password_hash"}
    token = create_access_token(public["id"], public["role"])
    return AuthResponse(
        user=UserResponse.model_validate(public),
        access_token=token,
    )


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest) -> AuthResponse:
    sb = get_supabase()
    email = str(body.email)
    try:
        res = (
            sb.table("users")
            .select(f"{_USER_PUBLIC_COLUMNS},password_hash")
            .eq("email", email)
            .single()
            .execute()
        )
    except APIError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    row = res.data
    if not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    public = {k: v for k, v in row.items() if k != "password_hash"}
    token = create_access_token(public["id"], public["role"])
    return AuthResponse(
        user=UserResponse.model_validate(public),
        access_token=token,
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user


@router.patch("/me", response_model=UserResponse)
def patch_me(
    body: UserUpdateBody,
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    data = body.model_dump(exclude_unset=True)
    if not data:
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            role=current_user.role,
            display_name=current_user.display_name,
            avatar_config=dict(current_user.avatar_config or {}),
            coins=current_user.coins,
            current_streak=current_user.current_streak,
            longest_streak=current_user.longest_streak,
            streak_freezes=current_user.streak_freezes,
            created_at=current_user.created_at,
        )
    sb = get_supabase()
    try:
        upd = sb.table("users").update(data).eq("id", current_user.id).execute()
    except APIError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update profile",
        ) from e
    if not upd.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not update profile")
    row = upd.data[0]
    public = {k: v for k, v in row.items() if k != "password_hash"}
    return UserResponse.model_validate(public)  # type: ignore[arg-type]


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"message": "Logged out"}
