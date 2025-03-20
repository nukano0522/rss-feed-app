from typing import AsyncGenerator, Optional, Dict, Any
from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase, BaseUserDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_async_session
from ..models.user import User
from app.dynamodb.repositories.users import DynamoUserRepository


# SQLAlchemy版のユーザーDB取得関数
async def get_user_db(
    session: AsyncSession = Depends(get_async_session),
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User)


# DynamoDB版のユーザーデータベースアダプター
class DynamoUserDatabase(BaseUserDatabase[User, int]):
    """FastAPI Usersで使用するDynamoDBアダプター"""

    def __init__(self):
        self.repository = DynamoUserRepository()

    async def get(self, id: int) -> Optional[User]:
        """ユーザーIDでユーザーを取得"""
        user_dict = await self.repository.get_user_by_id(id)
        if user_dict:
            return self._map_user(user_dict)
        return None

    async def get_by_email(self, email: str) -> Optional[User]:
        """メールアドレスでユーザーを取得"""
        user_dict = await self.repository.get_user_by_email(email)
        if user_dict:
            return self._map_user(user_dict)
        return None

    async def create(self, create_dict: Dict[str, Any]) -> User:
        """ユーザーを作成"""
        # ユーザーの作成
        user_dict = await self.repository.create_user(
            email=create_dict["email"],
            hashed_password=create_dict["hashed_password"],
            is_active=create_dict.get("is_active", True),
            is_superuser=create_dict.get("is_superuser", False),
            is_verified=create_dict.get("is_verified", False),
        )
        return self._map_user(user_dict)

    async def update(self, user: User, update_dict: Dict[str, Any]) -> User:
        """ユーザーを更新"""
        # ユーザー辞書に変換
        user_dict = await self.repository.update_user(user.id, update_dict)
        if user_dict:
            return self._map_user(user_dict)
        return user

    async def delete(self, user: User) -> None:
        """ユーザーを削除"""
        await self.repository.delete_user(user.id)

    def _map_user(self, user_dict: Dict[str, Any]) -> User:
        """DynamoDBのユーザー辞書からUserモデルに変換"""
        return User(
            id=user_dict["id"],
            email=user_dict["email"],
            hashed_password=user_dict["hashed_password"],
            is_active=user_dict.get("is_active", True),
            is_superuser=user_dict.get("is_superuser", False),
            is_verified=user_dict.get("is_verified", False),
        )


# DynamoDB版のユーザーDBを取得する関数
async def get_dynamo_user_db() -> AsyncGenerator[DynamoUserDatabase, None]:
    yield DynamoUserDatabase()
