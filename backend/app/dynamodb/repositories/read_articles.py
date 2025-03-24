import logging
import uuid
from datetime import datetime
from typing import List, Any

from app.schemas.feed import ReadArticle, ReadArticleCreate
from app.dynamodb.client import get_dynamodb_resource

logger = logging.getLogger(__name__)


class ReadArticleRepository:
    """既読記事リポジトリ"""

    def __init__(self):
        self.table_name = "read_articles"
        self.resource = get_dynamodb_resource()
        self.table = self.resource.Table(self.table_name)

    async def get_all_read_articles_by_user(self, user_id: Any) -> List[str]:
        """ユーザーIDでお気に入り記事を取得"""
        try:
            # user_idの文字列化
            user_id_str = str(user_id)

            # セカンダリインデックスを使用してクエリ（article_linkのみを射影）
            response = self.table.query(
                IndexName="user_id-index",
                KeyConditionExpression="user_id = :uid",
                ExpressionAttributeValues={":uid": user_id_str},
                ProjectionExpression="article_link",
            )

            # リンクのリストを抽出
            article_links = []
            for item in response.get("Items", []):
                link = item.get("article_link")
                if link:
                    article_links.append(link)

            return article_links
        except Exception as e:
            logger.error(f"既読記事の取得中にエラーが発生しました: {str(e)}")
            raise

    async def mark_article_as_read(
        self, article: ReadArticleCreate, user_id: Any
    ) -> ReadArticle:
        """記事を既読としてマーク"""
        try:
            # user_idの文字列化
            user_id_str = str(user_id)

            # 既存のアイテムをチェック
            response = self.table.query(
                IndexName="user_id-index",
                KeyConditionExpression="user_id = :uid",
                FilterExpression="article_link = :link",
                ExpressionAttributeValues={
                    ":uid": user_id_str,
                    ":link": article.article_link,
                },
            )

            if response.get("Items"):
                # 既に既読になっている場合は、そのアイテムを返す
                item = response["Items"][0]
                return ReadArticle(
                    id=item["id"],
                    user_id=item["user_id"],
                    article_link=item["article_link"],
                    read_at=item["read_at"],
                )

            # 新しいIDを生成
            item_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()

            # アイテムを作成
            item = {
                "id": item_id,
                "user_id": user_id_str,
                "article_link": article.article_link,
                "read_at": now,
            }

            # アイテムを追加
            self.table.put_item(Item=item)

            # スキーマに合わせたデータを返す
            return ReadArticle(
                id=item_id,
                user_id=user_id_str,
                article_link=article.article_link,
                read_at=now,
            )
        except Exception as e:
            logger.error(f"既読としてマーク中にエラーが発生しました: {str(e)}")
            raise
