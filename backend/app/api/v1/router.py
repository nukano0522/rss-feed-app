from fastapi import APIRouter
from app.api.v1.endpoints import feeds
from app.auth.auth import auth_backend, fastapi_users
from app.schemas.user import UserRead, UserCreate, UserUpdate

api_router = APIRouter()

# 認証関連のルーターを直接設定
api_router.include_router(
    fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"]
)

api_router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)

api_router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# フィード関連のルーター
api_router.include_router(feeds.router, prefix="/feeds", tags=["RSSフィード"])
