import boto3
import logging
from app.dynamodb.client import get_dynamodb_client
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


def create_feeds_table():
    """フィードテーブルを作成する"""
    try:
        client = get_dynamodb_client()

        # テーブルが既に存在するか確認
        existing_tables = client.list_tables()["TableNames"]
        if "feeds" in existing_tables:
            logger.info("フィードテーブルは既に存在します。")
            return

        # テーブルを作成
        response = client.create_table(
            TableName="feeds",
            KeySchema=[
                {"AttributeName": "id", "KeyType": "HASH"},  # パーティションキー
            ],
            AttributeDefinitions=[
                {"AttributeName": "id", "AttributeType": "S"},
                {"AttributeName": "url", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "url-index",
                    "KeySchema": [
                        {"AttributeName": "url", "KeyType": "HASH"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5,
                    },
                },
            ],
            ProvisionedThroughput={
                "ReadCapacityUnits": 10,
                "WriteCapacityUnits": 10,
            },
        )
        logger.info(f"フィードテーブルを作成しました: {response}")
        return response
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceInUseException":
            logger.info("フィードテーブルは既に存在します。")
        else:
            logger.error(f"テーブル作成エラー: {e}")
            raise
    except Exception as e:
        logger.error(f"予期せぬエラー: {e}")
        raise


def create_favorite_articles_table():
    """お気に入り記事テーブルを作成する"""
    try:
        client = get_dynamodb_client()

        # テーブルが既に存在するか確認
        existing_tables = client.list_tables()["TableNames"]
        if "favorite_articles" in existing_tables:
            logger.info("お気に入り記事テーブルは既に存在します。")
            return

        # テーブルを作成
        response = client.create_table(
            TableName="favorite_articles",
            KeySchema=[
                {"AttributeName": "id", "KeyType": "HASH"},  # パーティションキー
            ],
            AttributeDefinitions=[
                {"AttributeName": "id", "AttributeType": "S"},
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "article_link", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "user-id-index",
                    "KeySchema": [
                        {"AttributeName": "user_id", "KeyType": "HASH"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5,
                    },
                },
                {
                    "IndexName": "article-link-index",
                    "KeySchema": [
                        {"AttributeName": "article_link", "KeyType": "HASH"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5,
                    },
                },
            ],
            ProvisionedThroughput={
                "ReadCapacityUnits": 10,
                "WriteCapacityUnits": 10,
            },
        )
        logger.info(f"お気に入り記事テーブルを作成しました: {response}")
        return response
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceInUseException":
            logger.info("お気に入り記事テーブルは既に存在します。")
        else:
            logger.error(f"テーブル作成エラー: {e}")
            raise
    except Exception as e:
        logger.error(f"予期せぬエラー: {e}")
        raise


def init_tables():
    """すべてのテーブルを初期化する"""
    create_feeds_table()
    create_favorite_articles_table()


if __name__ == "__main__":
    init_tables()
