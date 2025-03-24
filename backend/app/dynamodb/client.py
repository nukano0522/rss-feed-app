import os
import boto3
import aioboto3
import logging
import time
from app.config import (
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    ENVIRONMENT,
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 標準出力ハンドラを作成
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# フォーマッタの作成と設定
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
console_handler.setFormatter(formatter)

# ハンドラをロガーに追加
logger.addHandler(console_handler)

# 環境変数から現在の環境を取得
IS_PRODUCTION = ENVIRONMENT.lower() == "production"

# ローカルエンドポイントは開発環境でのみ使用
DYNAMODB_ENDPOINT = (
    None
    if IS_PRODUCTION
    else os.getenv("DYNAMODB_ENDPOINT", "http://dynamodb-local:8000")
)

# シングルトンとしてセッションを保持
_aioboto3_session = None
_boto3_session = None


def get_aioboto3_session():
    """aioboto3セッションを取得（シングルトン）"""
    global _aioboto3_session

    if _aioboto3_session is not None:
        return _aioboto3_session

    start_time = time.time()
    _aioboto3_session = aioboto3.Session(
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )
    elapsed_time = time.time() - start_time
    logger.info(f"aioboto3セッション作成時間: {elapsed_time:.4f}秒")
    return _aioboto3_session


# シングルトンとしてDynamoDBクライアント設定を保持
_dynamodb_client_kwargs = None


def get_dynamodb_aioclient(**additional_kwargs):
    """非同期DynamoDBクライアントの設定を取得（キャッシュ利用）"""
    global _dynamodb_client_kwargs

    # 追加パラメータがない場合はキャッシュを利用
    if not additional_kwargs and _dynamodb_client_kwargs is not None:
        return _dynamodb_client_kwargs

    start_time = time.time()
    kwargs = {
        "service_name": "dynamodb",
        "region_name": AWS_REGION,
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
        # コネクションプールを設定
        "config": boto3.session.Config(
            max_pool_connections=50,  # コネクションプールサイズを増やす
            connect_timeout=5,  # 接続タイムアウトを5秒に設定
            retries={"max_attempts": 10},  # リトライ回数を増やす
        ),
    }

    # 開発環境の場合のみエンドポイントを指定
    if DYNAMODB_ENDPOINT:
        kwargs["endpoint_url"] = DYNAMODB_ENDPOINT
        logger.info(
            f"開発環境: 非同期DynamoDBクライアント - ローカルエンドポイント {DYNAMODB_ENDPOINT} を使用"
        )
    else:
        logger.info(
            f"本番環境: 非同期DynamoDBクライアント - AWS DynamoDBサービス({AWS_REGION})を使用"
        )

    # 追加の引数があれば追加
    kwargs.update(additional_kwargs)

    # 追加パラメータがない場合はキャッシュを更新
    if not additional_kwargs:
        _dynamodb_client_kwargs = kwargs

    elapsed_time = time.time() - start_time
    logger.debug(f"非同期DynamoDBクライアント設定時間: {elapsed_time:.4f}秒")
    return kwargs


# シングルトンとしてDynamoDBクライアントを保持
_dynamodb_client = None


def get_dynamodb_client():
    """同期DynamoDBクライアントを取得（シングルトン）"""
    global _dynamodb_client

    if _dynamodb_client is not None:
        return _dynamodb_client

    start_time = time.time()
    kwargs = {
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
        "region_name": AWS_REGION,
        "config": boto3.session.Config(
            max_pool_connections=50,
            connect_timeout=5,
            retries={"max_attempts": 10},
        ),
    }

    # 開発環境の場合のみエンドポイントを指定
    if DYNAMODB_ENDPOINT:
        kwargs["endpoint_url"] = DYNAMODB_ENDPOINT
        logger.info(
            f"開発環境: DynamoDBローカルエンドポイント {DYNAMODB_ENDPOINT} に接続します"
        )
    else:
        logger.info(f"本番環境: AWS DynamoDBサービス({AWS_REGION})に接続します")

    _dynamodb_client = boto3.client("dynamodb", **kwargs)
    elapsed_time = time.time() - start_time
    logger.info(f"同期DynamoDBクライアント作成時間: {elapsed_time:.4f}秒")
    return _dynamodb_client


# シングルトンとしてDynamoDBリソースを保持
_dynamodb_resource = None


def get_dynamodb_resource():
    """同期DynamoDBリソースを取得（シングルトン）"""
    global _dynamodb_resource

    if _dynamodb_resource is not None:
        return _dynamodb_resource

    start_time = time.time()
    kwargs = {
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
        "region_name": AWS_REGION,
        "config": boto3.session.Config(
            max_pool_connections=50,
            connect_timeout=5,
            retries={"max_attempts": 10},
        ),
    }

    # 開発環境の場合のみエンドポイントを指定
    if DYNAMODB_ENDPOINT:
        kwargs["endpoint_url"] = DYNAMODB_ENDPOINT

    _dynamodb_resource = boto3.resource("dynamodb", **kwargs)
    elapsed_time = time.time() - start_time
    logger.info(f"同期DynamoDBリソース作成時間: {elapsed_time:.4f}秒")
    return _dynamodb_resource
