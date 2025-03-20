import logging
import uuid
from datetime import datetime
from typing import List, Optional
from botocore.exceptions import ClientError
from app.dynamodb.client import get_dynamodb_client
from app.schemas.feed import FeedCreate, FeedUpdate

logger = logging.getLogger(__name__)

TABLE_NAME = "feeds"


class FeedRepository:
    """DynamoDBを使用したフィードリポジトリ"""

    def __init__(self):
        self.client = get_dynamodb_client()

    async def get_all_feeds(self) -> List[dict]:
        """全てのフィードを取得する"""
        try:
            response = self.client.scan(TableName=TABLE_NAME)
            return self._convert_dynamodb_items_to_dict(response.get("Items", []))
        except ClientError as e:
            logger.error(f"フィード取得エラー: {str(e)}")
            raise

    async def get_feed_by_id(self, feed_id: str) -> Optional[dict]:
        """IDでフィードを取得する"""
        try:
            response = self.client.get_item(
                TableName=TABLE_NAME, Key={"id": {"S": feed_id}}
            )
            item = response.get("Item")
            if not item:
                return None
            return self._convert_dynamodb_item_to_dict(item)
        except ClientError as e:
            logger.error(f"フィード取得エラー (ID: {feed_id}): {str(e)}")
            raise

    async def create_feed(self, feed: FeedCreate) -> dict:
        """フィードを作成する"""
        try:
            # UUIDを生成
            feed_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()

            item = {
                "id": {"S": feed_id},
                "name": {"S": feed.name},
                "url": {"S": feed.url},
                "enabled": {"BOOL": feed.enabled},
                "created_at": {"S": now},
            }

            if feed.default_image:
                item["default_image"] = {"S": feed.default_image}

            # DynamoDBに保存
            self.client.put_item(TableName=TABLE_NAME, Item=item)

            # 作成したアイテムを返す
            return self._convert_dynamodb_item_to_dict(item)
        except ClientError as e:
            logger.error(f"フィード作成エラー: {str(e)}")
            raise

    async def update_feed(
        self, feed_id: str, feed_update: FeedUpdate
    ) -> Optional[dict]:
        """フィードを更新する"""
        try:
            # 更新するフィールドを準備
            update_expression_parts = []
            expression_attribute_names = {}
            expression_attribute_values = {}

            update_data = feed_update.dict(exclude_unset=True)

            if not update_data:
                # 更新するデータがない場合は現在のデータを返す
                return await self.get_feed_by_id(feed_id)

            # 更新するフィールドごとに更新式を構築
            for key, value in update_data.items():
                update_expression_parts.append(f"#{key} = :{key}")
                expression_attribute_names[f"#{key}"] = key

                # 型に応じた値の設定
                if isinstance(value, bool):
                    expression_attribute_values[f":{key}"] = {"BOOL": value}
                elif value is None:
                    # Noneの場合は削除
                    update_expression_parts[-1] = f"REMOVE #{key}"
                    del expression_attribute_values[f":{key}"]
                else:
                    expression_attribute_values[f":{key}"] = {"S": str(value)}

            update_expression = "SET " + ", ".join(update_expression_parts)

            # 更新実行
            self.client.update_item(
                TableName=TABLE_NAME,
                Key={"id": {"S": feed_id}},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="ALL_NEW",
            )

            # 更新後のアイテムを返す
            return await self.get_feed_by_id(feed_id)
        except ClientError as e:
            logger.error(f"フィード更新エラー (ID: {feed_id}): {str(e)}")
            raise

    async def delete_feed(self, feed_id: str) -> bool:
        """フィードを削除する"""
        try:
            self.client.delete_item(TableName=TABLE_NAME, Key={"id": {"S": feed_id}})
            return True
        except ClientError as e:
            logger.error(f"フィード削除エラー (ID: {feed_id}): {str(e)}")
            raise

    def _convert_dynamodb_items_to_dict(self, items: List[dict]) -> List[dict]:
        """DynamoDBのアイテムリストを通常の辞書リストに変換"""
        return [self._convert_dynamodb_item_to_dict(item) for item in items]

    def _convert_dynamodb_item_to_dict(self, item: dict) -> dict:
        """DynamoDBのアイテムを通常の辞書に変換"""
        result = {}
        for key, value in item.items():
            # valueの型によって変換方法を変える
            if "S" in value:
                result[key] = value["S"]
            elif "N" in value:
                # 数値はintまたはfloatに変換
                try:
                    num = int(value["N"])
                except ValueError:
                    num = float(value["N"])
                result[key] = num
            elif "BOOL" in value:
                result[key] = value["BOOL"]
            elif "NULL" in value:
                result[key] = None
            elif "L" in value:
                # リストの場合は再帰的に変換
                result[key] = [
                    self._convert_dynamodb_value_to_python(v) for v in value["L"]
                ]
            elif "M" in value:
                # マップの場合は再帰的に変換
                result[key] = {
                    k: self._convert_dynamodb_value_to_python(v)
                    for k, v in value["M"].items()
                }
            else:
                # その他の型はそのまま
                result[key] = value
        return result

    def _convert_dynamodb_value_to_python(self, value: dict):
        """DynamoDBの値をPythonの値に変換"""
        for type_key, actual_value in value.items():
            if type_key == "S":
                return actual_value
            elif type_key == "N":
                try:
                    return int(actual_value)
                except ValueError:
                    return float(actual_value)
            elif type_key == "BOOL":
                return actual_value
            elif type_key == "NULL":
                return None
            elif type_key == "L":
                return [self._convert_dynamodb_value_to_python(v) for v in actual_value]
            elif type_key == "M":
                return {
                    k: self._convert_dynamodb_value_to_python(v)
                    for k, v in actual_value.items()
                }
        return value
