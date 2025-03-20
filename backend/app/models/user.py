from fastapi_users import schemas
from typing import Optional


class User(schemas.BaseUser[int]):
    """アプリケーションのユーザーモデル

    SQLAlchemyを使用せず、DynamoDBと連携するためのメモリ上のモデル
    """

    id: int
    email: str
    hashed_password: str
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False


class UserCreate(schemas.BaseUserCreate):
    """ユーザー作成モデル"""

    email: str
    password: str
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    is_verified: Optional[bool] = False


class UserUpdate(schemas.BaseUserUpdate):
    """ユーザー更新モデル"""

    password: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_verified: Optional[bool] = None
