"""JWT auth for intelligence routes (Bearer token, same as platform)."""

from typing import Annotated

from fastapi import Depends

from app_platform.auth.dependencies import get_current_user
from models.user import User


async def get_current_user_id(
    current_user: Annotated[User, Depends(get_current_user)],
) -> int:
    """Numeric ``users.id`` for Supabase bigint columns and path params."""
    return int(current_user.id)
