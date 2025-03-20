import logging
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from app.schemas.feed import AiSummary, AiSummaryCreate
from app.dynamodb.client import get_dynamodb_resource

logger = logging.getLogger(__name__)


class AiSummaryRepository:
    """AI要約リポジトリ"""

    def __init__(self):
        self.table_name = "ai_summaries"
        self.resource = get_dynamodb_resource()
        self.table = self.resource.Table(self.table_name)

    async def get_summary_by_article_link(
        self, article_link: str, feed_id: Optional[str] = None
    ) -> Optional[AiSummary]:
        """記事リンクからAI要約を取得"""
        try:
            # フィードIDがある場合は、フィードIDとリンクの両方で検索
            if feed_id:
                response = self.table.query(
                    IndexName="article_link-feed_id-index",
                    KeyConditionExpression="article_link = :article_link AND feed_id = :feed_id",
                    ExpressionAttributeValues={
                        ":article_link": article_link,
                        ":feed_id": feed_id,
                    },
                )
            else:
                # フィードIDがない場合は、リンクだけで検索し、フィードIDがnullのものを探す
                response = self.table.query(
                    IndexName="article_link-index",
                    KeyConditionExpression="article_link = :article_link",
                    FilterExpression="attribute_not_exists(feed_id)",
                    ExpressionAttributeValues={":article_link": article_link},
                )

            items = response.get("Items", [])
            if not items:
                return None

            # 最初のアイテムを返す（結果は1つのみのはず）
            item = items[0]
            return AiSummary(
                id=item.get("id"),
                feed_id=item.get("feed_id"),
                article_link=item.get("article_link"),
                summary=item.get("summary"),
                created_at=item.get("created_at"),
            )
        except Exception as e:
            logger.error(f"AI要約取得中にエラーが発生しました: {str(e)}")
            return None

    async def create_summary(
        self, article_link: str, summary: str, feed_id: Optional[str] = None
    ) -> AiSummary:
        """新しいAI要約を作成"""
        try:
            # 新しいIDを生成
            summary_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()

            # アイテムを作成
            item = {
                "id": summary_id,
                "article_link": article_link,
                "summary": summary,
                "created_at": now,
            }

            # フィードIDがある場合は追加
            if feed_id:
                item["feed_id"] = feed_id

            # アイテムを追加
            self.table.put_item(Item=item)

            # スキーマに合わせたデータを返す
            return AiSummary(
                id=summary_id,
                feed_id=feed_id,
                article_link=article_link,
                summary=summary,
                created_at=now,
            )
        except Exception as e:
            logger.error(f"AI要約作成中にエラーが発生しました: {str(e)}")
            raise
