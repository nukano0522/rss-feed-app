import os
import boto3
import aioboto3
import logging
from app.config import (
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    ENVIRONMENT,
)

logger = logging.getLogger(__name__)

# 環境変数から現在の環境を取得
IS_PRODUCTION = ENVIRONMENT.lower() == "production"

# ローカルエンドポイントは開発環境でのみ使用
DYNAMODB_ENDPOINT = (
    None
    if IS_PRODUCTION
    else os.getenv("DYNAMODB_ENDPOINT", "http://dynamodb-local:8000")
)


def get_aioboto3_session():
    """aioboto3セッションを取得"""
    return aioboto3.Session(
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )


def get_dynamodb_client():
    """同期DynamoDBクライアントを取得"""
    kwargs = {
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
        "region_name": AWS_REGION,
    }

    # 開発環境の場合のみエンドポイントを指定
    if DYNAMODB_ENDPOINT:
        kwargs["endpoint_url"] = DYNAMODB_ENDPOINT
        logger.info(
            f"開発環境: DynamoDBローカルエンドポイント {DYNAMODB_ENDPOINT} に接続します"
        )
    else:
        logger.info(f"本番環境: AWS DynamoDBサービス({AWS_REGION})に接続します")

    return boto3.client("dynamodb", **kwargs)


def get_dynamodb_resource():
    """同期DynamoDBリソースを取得"""
    kwargs = {
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
        "region_name": AWS_REGION,
    }

    # 開発環境の場合のみエンドポイントを指定
    if DYNAMODB_ENDPOINT:
        kwargs["endpoint_url"] = DYNAMODB_ENDPOINT

    return boto3.resource("dynamodb", **kwargs)


def get_dynamodb_aioclient(**additional_kwargs):
    """非同期DynamoDBクライアントの設定を取得"""
    kwargs = {
        "service_name": "dynamodb",
        "region_name": AWS_REGION,
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
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

    return kwargs
