import logging
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
import aioboto3
from app.schemas.feed import FavoriteArticle, FavoriteArticleCreate
from app.config import (
    DYNAMODB_ENDPOINT,
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FavoriteArticleRepository:
    """お気に入り記事リポジトリ"""

    def __init__(self):
        self.table_name = "favorite_articles"
        # セッションを保持
        self.session = aioboto3.Session()

    async def get_favorite_articles_by_user(
        self, user_id: Any
    ) -> List[FavoriteArticle]:
        """ユーザーIDでお気に入り記事を取得"""
        logger.info(f"Getting favorite articles for user {user_id}")

        async with self.session.client(
            "dynamodb",
            endpoint_url=DYNAMODB_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        ) as client:
            try:
                # user_idの文字列化
                user_id_str = str(user_id)

                # ログ追加
                logger.debug(f"テーブル名: {self.table_name}, user_id: {user_id_str}")
                logger.debug(f"インデックス名: user_id-index")

                # セカンダリインデックスを使用してクエリ
                response = await client.query(
                    TableName=self.table_name,
                    IndexName="user_id-index",
                    KeyConditionExpression="user_id = :uid",
                    ExpressionAttributeValues={":uid": {"S": user_id_str}},
                )

                logger.debug(f"クエリレスポンス: {response}")
                items = response.get("Items", [])
                logger.debug(f"取得アイテム数: {len(items)}")

                favorite_articles = []

                for item in items:
                    logger.debug(f"処理アイテム: {item}")
                    article = self._deserialize_dynamodb_item(item)
                    favorite_articles.append(FavoriteArticle(**article))

                logger.debug(f"返却するお気に入り記事数: {len(favorite_articles)}")
                return favorite_articles

            except Exception as e:
                logger.error(f"お気に入り記事の取得エラー: {str(e)}", exc_info=True)
                # 例外を投げて上位レイヤーで処理する
                raise

    def _deserialize_dynamodb_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """DynamoDBアイテムをPythonディクショナリに変換"""
        result = {}
        for k, v in item.items():
            if "S" in v:
                result[k] = v["S"]
            elif "N" in v:
                result[k] = int(v["N"])
            elif "BOOL" in v:
                result[k] = v["BOOL"]
            elif "L" in v:
                result[k] = [
                    self._deserialize_dynamodb_item(i) if isinstance(i, dict) else i
                    for i in v["L"]
                ]
            elif "SS" in v:
                result[k] = v["SS"]
            elif "NS" in v:
                result[k] = [int(n) for n in v["NS"]]
            elif "M" in v:
                result[k] = self._deserialize_dynamodb_item(v["M"])
        return result

    def _serialize_value(self, value):
        """値をDynamoDB形式にシリアライズ"""
        if isinstance(value, str):
            return {"S": value}
        elif isinstance(value, bool):
            return {"BOOL": value}
        elif isinstance(value, int) or isinstance(value, float):
            return {"N": str(value)}
        elif isinstance(value, list):
            if not value:  # 空のリスト
                return {"L": []}
            elif all(isinstance(x, str) for x in value):
                # 文字列のリスト
                return {"SS": value}
            elif all(isinstance(x, (int, float)) for x in value):
                # 数値のリスト
                return {"NS": [str(x) for x in value]}
            else:
                # 混合型リスト
                return {"L": [self._serialize_value(x) for x in value]}
        elif value is None:
            return {"NULL": True}
        else:
            # その他はすべて文字列として扱う
            return {"S": str(value)}

    def _serialize_dynamodb_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Pythonディクショナリをmultiple_items_to_update形式に変換"""
        result = {}
        for k, v in item.items():
            result[k] = self._serialize_value(v)
        return result

    async def add_favorite_article(
        self, article: FavoriteArticleCreate, user_id: Any
    ) -> FavoriteArticle:
        """記事をお気に入りに追加"""
        async with self.session.client(
            "dynamodb",
            endpoint_url=DYNAMODB_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        ) as client:
            try:
                # user_idの文字列化
                user_id_str = str(user_id)

                logger.debug(
                    f"お気に入り記事追加: user_id={user_id_str}, article_link={article.article_link}"
                )

                # 既存のアイテムをチェック
                response = await client.query(
                    TableName=self.table_name,
                    IndexName="user_id-index",
                    KeyConditionExpression="user_id = :uid",
                    FilterExpression="article_link = :link",
                    ExpressionAttributeValues={
                        ":uid": {"S": user_id_str},
                        ":link": {"S": article.article_link},
                    },
                )

                if response.get("Items"):
                    logger.warning(
                        f"この記事は既にお気に入りに登録されています: {article.article_link}"
                    )
                    raise ValueError("この記事は既にお気に入りに登録されています")

                # 新しいIDを生成
                item_id = str(uuid.uuid4())
                now = datetime.utcnow().isoformat()

                logger.debug(f"新規お気に入り記事ID: {item_id}")

                # アイテムを作成
                item = {
                    "id": item_id,
                    "user_id": user_id_str,
                    "article_link": article.article_link,
                    "article_title": article.article_title,
                    "article_description": article.article_description or "",
                    "article_image": article.article_image or "",
                    "favorited_at": now,
                    "is_external": (
                        article.is_external
                        if isinstance(article.is_external, bool)
                        else False
                    ),
                }

                # article_categoriesが空でない場合のみ追加
                if article.article_categories:
                    # リストが空でないことを確認し、全て文字列に変換
                    item["article_categories"] = [
                        str(cat) for cat in article.article_categories
                    ]
                else:
                    item["article_categories"] = []

                # feed_idがあれば追加
                if article.feed_id is not None:
                    item["feed_id"] = str(article.feed_id)

                logger.debug(f"作成アイテム: {item}")

                # DynamoDB形式に変換
                dynamodb_item = self._serialize_dynamodb_item(item)

                # デバッグ用：シリアライズしたアイテムを出力
                logger.debug(f"DynamoDB形式アイテム: {dynamodb_item}")

                # アイテムを追加
                await client.put_item(
                    TableName=self.table_name,
                    Item=dynamodb_item,
                )

                logger.info(f"お気に入り記事を追加しました: {item_id}")

                # スキーマに合わせたデータを返す
                result = FavoriteArticle(
                    id=item_id,
                    user_id=user_id_str,
                    article_link=article.article_link,
                    article_title=article.article_title,
                    article_description=article.article_description,
                    article_image=article.article_image,
                    article_categories=item["article_categories"],
                    feed_id=article.feed_id,
                    is_external=bool(article.is_external),
                    favorited_at=now,
                )

                return result

            except ValueError as ve:
                # 既存エラーを再送
                raise ve
            except Exception as e:
                logger.error(f"お気に入り記事の追加エラー: {str(e)}", exc_info=True)
                raise

    async def check_favorite_articles(self, user_id: Any) -> List[str]:
        """ユーザーがお気に入りにした記事リンクの一覧を取得"""
        async with self.session.client(
            "dynamodb",
            endpoint_url=DYNAMODB_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        ) as client:
            try:
                user_id_str = str(user_id)

                logger.debug(f"お気に入り記事リンク一覧取得: user_id={user_id_str}")

                # セカンダリインデックスを使用してクエリ
                response = await client.query(
                    TableName=self.table_name,
                    IndexName="user_id-index",
                    KeyConditionExpression="user_id = :uid",
                    ExpressionAttributeValues={":uid": {"S": user_id_str}},
                    ProjectionExpression="article_link",
                )

                links = []
                for item in response.get("Items", []):
                    if "article_link" in item and "S" in item["article_link"]:
                        links.append(item["article_link"]["S"])

                logger.debug(f"取得したお気に入り記事リンク数: {len(links)}")
                return links

            except Exception as e:
                logger.error(
                    f"お気に入り記事リンク一覧の取得エラー: {str(e)}", exc_info=True
                )
                raise

    async def remove_favorite_article(self, article_link: str, user_id: Any) -> bool:
        """お気に入りから記事を削除"""
        async with self.session.client(
            "dynamodb",
            endpoint_url=DYNAMODB_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        ) as client:
            try:
                user_id_str = str(user_id)

                logger.debug(
                    f"お気に入り記事削除: user_id={user_id_str}, article_link={article_link}"
                )

                # 該当するアイテムを検索
                response = await client.query(
                    TableName=self.table_name,
                    IndexName="user_id-index",
                    KeyConditionExpression="user_id = :uid",
                    FilterExpression="article_link = :link",
                    ExpressionAttributeValues={
                        ":uid": {"S": user_id_str},
                        ":link": {"S": article_link},
                    },
                )

                if not response.get("Items"):
                    logger.warning(f"お気に入りの記事が見つかりません: {article_link}")
                    raise ValueError("お気に入りの記事が見つかりません")

                # 見つかったアイテムを削除
                item = response["Items"][0]
                item_id = item["id"]["S"]

                logger.debug(f"削除するお気に入り記事ID: {item_id}")

                # 削除処理
                await client.delete_item(
                    TableName=self.table_name,
                    Key={"id": {"S": item_id}},
                )

                logger.info(f"お気に入り記事を削除しました: {item_id}")

                return True

            except ValueError as ve:
                # 既存エラーを再送
                raise ve
            except Exception as e:
                logger.error(f"お気に入り記事の削除エラー: {str(e)}", exc_info=True)
                raise

    async def _check_existing_favorite(self, user_id: str, article_link: str) -> bool:
        """既存のお気に入り記事をチェックする"""
        async with self.session.client(
            "dynamodb",
            endpoint_url=DYNAMODB_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        ) as client:
            try:
                # user_idの文字列化
                user_id_str = str(user_id)

                # セカンダリインデックスを使用してクエリ
                response = await client.query(
                    TableName=self.table_name,
                    IndexName="user_id-index",
                    KeyConditionExpression="user_id = :uid",
                    FilterExpression="article_link = :link",
                    ExpressionAttributeValues={
                        ":uid": {"S": user_id_str},
                        ":link": {"S": article_link},
                    },
                )

                # アイテムがあるかチェック
                items = response.get("Items", [])
                return len(items) > 0

            except Exception as e:
                logger.error(f"お気に入りチェックエラー: {str(e)}", exc_info=True)
                return False

    async def get_favorite_article_by_id(
        self, article_id: Any
    ) -> Optional[FavoriteArticle]:
        """IDでお気に入り記事を取得"""
        async with self.session.client(
            "dynamodb",
            endpoint_url=DYNAMODB_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        ) as client:
            try:
                # IDを数値に変換して数値型として扱う
                try:
                    numeric_id = int(article_id)
                    id_attr = {"N": str(numeric_id)}
                except (ValueError, TypeError):
                    # 変換できない場合は文字列として扱う（後方互換性のため）
                    id_attr = {"S": str(article_id)}

                # テーブルからアイテムを取得
                response = await client.get_item(
                    TableName=self.table_name,
                    Key={"id": id_attr},
                )

                # アイテムがなければNoneを返す
                item = response.get("Item")
                if not item:
                    return None

                # DynamoDBアイテムを変換
                article_data = self._deserialize_dynamodb_item(item)

                # スキーマに合わせたデータを返す
                return FavoriteArticle(**article_data)

            except Exception as e:
                logger.error(f"お気に入り記事の取得エラー: {str(e)}", exc_info=True)
                raise

    async def delete_favorite_article(self, article_id: Any) -> bool:
        """お気に入り記事を削除"""
        async with self.session.client(
            "dynamodb",
            endpoint_url=DYNAMODB_ENDPOINT,
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        ) as client:
            try:
                # IDを数値に変換して数値型として扱う
                try:
                    numeric_id = int(article_id)
                    id_attr = {"N": str(numeric_id)}
                except (ValueError, TypeError):
                    # 変換できない場合は文字列として扱う（後方互換性のため）
                    id_attr = {"S": str(article_id)}

                # テーブルからアイテムを削除
                await client.delete_item(
                    TableName=self.table_name,
                    Key={"id": id_attr},
                )
                return True

            except Exception as e:
                logger.error(f"お気に入り記事の削除エラー: {str(e)}", exc_info=True)
                raise
