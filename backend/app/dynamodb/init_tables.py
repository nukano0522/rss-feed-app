import logging
import os
from app.dynamodb.client import (
    get_aioboto3_session,
    get_dynamodb_client,
    get_dynamodb_resource,
)

logger = logging.getLogger(__name__)


# テーブル作成関数の簡略化版
async def create_table_if_not_exists(
    table_name, key_schema, attribute_defs, gsi=None, throughput=None
):
    """指定されたテーブルが存在しない場合に作成する"""
    try:
        # 同期クライアントでテーブル一覧を取得
        dynamodb = get_dynamodb_client()
        tables = dynamodb.list_tables()
        if table_name in tables.get("TableNames", []):
            logger.info(f"{table_name}テーブルは既に存在します")
            return True

        # テーブルが存在しない場合は作成
        logger.info(f"{table_name}テーブルを作成します...")

        # デフォルト値
        if throughput is None:
            throughput = {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}

        # リソースを使用してテーブルを作成
        res = get_dynamodb_resource()
        params = {
            "TableName": table_name,
            "KeySchema": key_schema,
            "AttributeDefinitions": attribute_defs,
            "ProvisionedThroughput": throughput,
        }

        # GSIがあれば追加
        if gsi:
            params["GlobalSecondaryIndexes"] = gsi

        table = res.create_table(**params)
        logger.info(f"{table_name}テーブルが正常に作成されました")
        return True
    except Exception as e:
        if "Table already exists" in str(e):
            logger.info(f"{table_name}テーブルは既に存在します")
            return True
        else:
            logger.error(f"{table_name}テーブル作成中にエラー: {str(e)}")
            return False


async def init_tables():
    """すべてのテーブルを初期化"""
    # feedsテーブル
    feeds_key_schema = [{"AttributeName": "id", "KeyType": "HASH"}]
    feeds_attrs = [
        {"AttributeName": "id", "AttributeType": "S"},
        {"AttributeName": "name", "AttributeType": "S"},
    ]
    feeds_gsi = [
        {
            "IndexName": "name-index",
            "KeySchema": [{"AttributeName": "name", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"},
            "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        }
    ]

    # favorite_articlesテーブル
    fav_key_schema = [{"AttributeName": "id", "KeyType": "HASH"}]
    fav_attrs = [
        {"AttributeName": "id", "AttributeType": "S"},
        {"AttributeName": "user_id", "AttributeType": "S"},
        {"AttributeName": "article_link", "AttributeType": "S"},
    ]
    fav_gsi = [
        {
            "IndexName": "user_id-index",
            "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"},
            "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        },
        {
            "IndexName": "article_link-index",
            "KeySchema": [{"AttributeName": "article_link", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"},
            "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        },
    ]

    # read_articlesテーブル
    read_key_schema = [{"AttributeName": "id", "KeyType": "HASH"}]
    read_attrs = [
        {"AttributeName": "id", "AttributeType": "S"},
        {"AttributeName": "user_id", "AttributeType": "S"},
        {"AttributeName": "article_link", "AttributeType": "S"},
    ]
    read_gsi = [
        {
            "IndexName": "user_id-index",
            "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"},
            "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        },
        {
            "IndexName": "article_link-index",
            "KeySchema": [{"AttributeName": "article_link", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"},
            "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        },
    ]

    # usersテーブル
    users_key_schema = [{"AttributeName": "id", "KeyType": "HASH"}]
    users_attrs = [
        {"AttributeName": "id", "AttributeType": "N"},
        {"AttributeName": "email", "AttributeType": "S"},
    ]
    users_gsi = [
        {
            "IndexName": "email-index",
            "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"},
            "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        }
    ]

    # ai_summariesテーブル
    summaries_key_schema = [{"AttributeName": "id", "KeyType": "HASH"}]
    summaries_attrs = [
        {"AttributeName": "id", "AttributeType": "S"},
        {"AttributeName": "article_link", "AttributeType": "S"},
        {"AttributeName": "feed_id", "AttributeType": "S"},
    ]
    summaries_gsi = [
        {
            "IndexName": "article_link-index",
            "KeySchema": [{"AttributeName": "article_link", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"},
            "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        },
        {
            "IndexName": "article_link-feed_id-index",
            "KeySchema": [
                {"AttributeName": "article_link", "KeyType": "HASH"},
                {"AttributeName": "feed_id", "KeyType": "RANGE"},
            ],
            "Projection": {"ProjectionType": "ALL"},
            "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        },
    ]

    # テーブル作成を実行
    status_feeds = await create_table_if_not_exists(
        "feeds", feeds_key_schema, feeds_attrs, feeds_gsi
    )
    status_favs = await create_table_if_not_exists(
        "favorite_articles", fav_key_schema, fav_attrs, fav_gsi
    )
    status_reads = await create_table_if_not_exists(
        "read_articles", read_key_schema, read_attrs, read_gsi
    )
    status_users = await create_table_if_not_exists(
        "users", users_key_schema, users_attrs, users_gsi
    )
    status_summaries = await create_table_if_not_exists(
        "ai_summaries", summaries_key_schema, summaries_attrs, summaries_gsi
    )

    # 作成されたテーブル一覧を取得
    dynamodb = get_dynamodb_client()
    tables = dynamodb.list_tables().get("TableNames", [])

    return {
        "status": "success",
        "message": "テーブルの初期化が完了しました",
        "tables": tables,
    }
