from typing import Optional
import pydantic
from fastapi_users.db import SQLAlchemyBaseUserTable
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "user"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(
        String(length=320), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(length=1024), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # DynamoDBからの変換をサポートするための追加メソッド
    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        """DynamoDBの辞書形式から変換するためのメソッド"""
        if isinstance(obj, dict):
            # 辞書形式からモデルに変換
            return cls(
                id=obj.get("id"),
                email=obj.get("email"),
                hashed_password=obj.get("hashed_password"),
                is_active=obj.get("is_active", True),
                is_superuser=obj.get("is_superuser", False),
                is_verified=obj.get("is_verified", False),
            )
        # その他の形式の場合はデフォルトの処理を行う
        return pydantic.v1.parse_obj_as(cls, obj, *args, **kwargs)
