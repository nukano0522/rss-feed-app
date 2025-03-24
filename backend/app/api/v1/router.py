from fastapi import APIRouter
from app.dynamodb.routes import router as dynamodb_router
from app.api.v1.endpoints.feeds import router as feeds_router
from app.auth.auth import auth_backend, fastapi_users
from app.schemas.user import UserRead, UserCreate, UserUpdate
from datetime import datetime
import os

api_router = APIRouter()


# ヘルスチェックエンドポイント（API用）
@api_router.get("/health", tags=["health"])
async def api_health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().timestamp(),
        "environment": os.getenv("ENVIRONMENT", "production"),
        "api_version": "v1",
        "storage": "DynamoDB",
    }


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
api_router.include_router(feeds_router, prefix="/feeds", tags=["RSSフィード"])

# DynamoDBテスト用ルーター
api_router.include_router(dynamodb_router, prefix="/dynamodb", tags=["dynamodb"])
