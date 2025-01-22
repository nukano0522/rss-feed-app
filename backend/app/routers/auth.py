from fastapi import APIRouter
from ..auth.auth import auth_backend, fastapi_users
from ..schemas.user import UserRead, UserCreate, UserUpdate

router = APIRouter()

# 認証ルートの追加
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)

router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)

router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)
