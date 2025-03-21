import logging
import uuid
import time
import os
from typing import List, Dict, Any, Optional
from decimal import Decimal
from botocore.exceptions import ClientError
from app.dynamodb.client import get_dynamodb_resource, get_aioboto3_session, AWS_REGION

logger = logging.getLogger(__name__)


class DynamoUserRepository:
    """DynamoDBを使用したユーザーリポジトリ"""

    def __init__(self):
        self.table_name = "users"
        self.resource = get_dynamodb_resource()
        self.table = self.resource.Table(self.table_name)

    async def create_user(
        self,
        email: str,
        hashed_password: str,
        is_active: bool = True,
        is_superuser: bool = False,
        is_verified: bool = False,
    ) -> Dict[str, Any]:
        """新しいユーザーを作成"""
        try:
            # 既存のメールアドレスをチェック
            existing_user = await self.get_user_by_email(email)
            if existing_user:
                raise ValueError(f"メールアドレス {email} は既に使用されています")

            # 新しいユーザーデータを作成
            timestamp = int(time.time())
            user_id = int(uuid.uuid4().int % (10**12))  # 整数IDを生成

            user_item = {
                "id": user_id,
                "email": email,
                "hashed_password": hashed_password,
                "is_active": is_active,
                "is_superuser": is_superuser,
                "is_verified": is_verified,
                "created_at": timestamp,
                "updated_at": timestamp,
            }

            # 同期APIを使用してアイテム保存
            self.table.put_item(Item=user_item)
            return user_item
        except Exception as e:
            logger.error(f"ユーザー作成中にエラー: {str(e)}")
            raise

    async def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """IDでユーザーを取得"""
        try:
            # 同期APIを使用
            response = self.table.get_item(Key={"id": user_id})
            if "Item" in response:
                return response["Item"]
            return None
        except Exception as e:
            logger.error(f"ユーザー取得中にエラー (ID: {user_id}): {str(e)}")
            return None

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """メールアドレスでユーザーを取得"""
        try:
            # 同期APIを使用
            response = self.table.query(
                IndexName="email-index",
                KeyConditionExpression="#email = :email_val",
                ExpressionAttributeNames={"#email": "email"},
                ExpressionAttributeValues={":email_val": email},
            )

            if response["Items"] and len(response["Items"]) > 0:
                return response["Items"][0]
            return None
        except Exception as e:
            logger.error(f"ユーザー取得中にエラー (Email: {email}): {str(e)}")
            return None

    async def update_user(
        self, user_id: int, update_dict: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """ユーザー情報を更新"""
        try:
            # 更新式と属性を構築
            update_expression = "SET "
            expression_attribute_values = {}
            expression_attribute_names = {}

            for key, value in update_dict.items():
                if value is not None and key != "id":
                    update_expression += f"#{key} = :{key}, "
                    expression_attribute_values[f":{key}"] = value
                    expression_attribute_names[f"#{key}"] = key

            # タイムスタンプを自動更新
            update_expression += "#updated_at = :updated_at"
            expression_attribute_values[":updated_at"] = int(time.time())
            expression_attribute_names["#updated_at"] = "updated_at"

            # 同期APIを使用
            response = self.table.update_item(
                Key={"id": user_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ExpressionAttributeNames=expression_attribute_names,
                ReturnValues="ALL_NEW",
            )

            if "Attributes" in response:
                return response["Attributes"]
            return None
        except Exception as e:
            logger.error(f"ユーザー更新中にエラー (ID: {user_id}): {str(e)}")
            return None

    async def delete_user(self, user_id: int) -> bool:
        """ユーザーを削除"""
        try:
            # 同期APIを使用
            self.table.delete_item(Key={"id": user_id})
            return True
        except Exception as e:
            logger.error(f"ユーザー削除中にエラー (ID: {user_id}): {str(e)}")
            return False
