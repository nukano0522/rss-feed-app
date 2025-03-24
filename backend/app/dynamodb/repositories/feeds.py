import logging
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from app.schemas.feed import Feed, FeedCreate, FeedUpdate
from app.dynamodb.client import get_dynamodb_resource

logger = logging.getLogger(__name__)


class FeedRepository:
    """フィードリポジトリ"""

    def __init__(self):
        self.table_name = "feeds"
        self.resource = get_dynamodb_resource()
        self.table = self.resource.Table(self.table_name)

    async def get_all_feeds(self) -> List[Feed]:
        """全フィードを取得"""
        try:
            # すべてのアイテムを取得
            response = self.table.scan()

            feeds = []
            for item in response.get("Items", []):
                feed = Feed(
                    id=item.get("id"),
                    name=item.get("name"),
                    url=item.get("url"),
                    enabled=item.get("enabled", True),
                    default_image=item.get("default_image"),
                    created_at=item.get("created_at"),
                )
                feeds.append(feed)

            return feeds
        except Exception as e:
            logger.error(f"フィード全件取得中にエラーが発生しました: {str(e)}")
            raise

    async def get_feed_by_id(self, feed_id: str) -> Optional[Feed]:
        """IDによるフィード検索"""
        try:
            # IDでアイテムを取得
            response = self.table.get_item(Key={"id": feed_id})

            item = response.get("Item")
            if not item:
                return None

            feed = Feed(
                id=item.get("id"),
                name=item.get("name"),
                url=item.get("url"),
                enabled=item.get("enabled", True),
                default_image=item.get("default_image"),
                created_at=item.get("created_at"),
            )

            return feed
        except Exception as e:
            logger.error(
                f"フィードID検索中にエラーが発生しました (ID: {feed_id}): {str(e)}"
            )
            raise

    async def create_feed(self, feed: FeedCreate) -> Feed:
        """フィードを作成"""
        try:
            # 新しいIDを生成
            feed_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()

            # アイテムを作成
            item = {
                "id": feed_id,
                "name": feed.name,
                "url": feed.url,
                "enabled": feed.enabled,
                "default_image": feed.default_image,
                "created_at": now,
            }

            # アイテムを追加
            self.table.put_item(Item=item)

            # スキーマに合わせたデータを返す
            return Feed(
                id=feed_id,
                name=feed.name,
                url=feed.url,
                enabled=feed.enabled,
                default_image=feed.default_image,
                created_at=now,
            )
        except Exception as e:
            logger.error(f"フィード作成中にエラーが発生しました: {str(e)}")
            raise

    async def update_feed(self, feed_id: str, feed_update: FeedUpdate) -> Feed:
        """フィードを更新"""
        try:
            # 既存のフィードを取得
            response = self.table.get_item(Key={"id": feed_id})

            item = response.get("Item")
            if not item:
                raise ValueError(f"フィードが見つかりません (ID: {feed_id})")

            # 更新するフィールドを設定
            update_data = {}
            update_expressions = []
            expression_values = {}

            # 更新されたフィールドのみを処理
            for field, value in feed_update.dict(exclude_unset=True).items():
                if value is not None:  # Noneでない値のみを更新
                    update_expressions.append(f"#{field} = :{field}")
                    update_data[f"#{field}"] = field
                    expression_values[f":{field}"] = value

            if not update_expressions:
                # 更新なしの場合は既存のフィードを返す
                return Feed(**item)

            # 更新式を構築
            update_expression = "SET " + ", ".join(update_expressions)

            # アイテムを更新
            response = self.table.update_item(
                Key={"id": feed_id},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=update_data,
                ExpressionAttributeValues=expression_values,
                ReturnValues="ALL_NEW",
            )

            updated_item = response.get("Attributes", {})

            # 更新されたフィードを返す
            return Feed(
                id=updated_item.get("id"),
                name=updated_item.get("name"),
                url=updated_item.get("url"),
                enabled=updated_item.get("enabled", True),
                default_image=updated_item.get("default_image"),
                created_at=updated_item.get("created_at"),
            )
        except ValueError:
            raise
        except Exception as e:
            logger.error(
                f"フィード更新中にエラーが発生しました (ID: {feed_id}): {str(e)}"
            )
            raise

    async def delete_feed(self, feed_id: str) -> bool:
        """フィードを削除"""
        try:
            # アイテムを削除
            self.table.delete_item(Key={"id": feed_id})

            return True
        except Exception as e:
            logger.error(
                f"フィード削除中にエラーが発生しました (ID: {feed_id}): {str(e)}"
            )
            raise
