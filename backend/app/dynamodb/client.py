import os
import boto3
import aioboto3
import logging

logger = logging.getLogger(__name__)

# DynamoDBの設定
DYNAMODB_ENDPOINT = os.getenv("DYNAMODB_ENDPOINT", "http://dynamodb-local:8000")
AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "dummy")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "dummy")


def get_aioboto3_session():
    """aioboto3セッションを取得"""
    return aioboto3.Session(
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )


def get_dynamodb_client():
    """同期DynamoDBクライアントを取得"""
    logger.info(f"Creating DynamoDB client with endpoint: {DYNAMODB_ENDPOINT}")
    return boto3.client(
        "dynamodb",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
        endpoint_url=DYNAMODB_ENDPOINT,
    )


def get_dynamodb_resource():
    """同期DynamoDBリソースを取得"""
    return boto3.resource(
        "dynamodb",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
        endpoint_url=DYNAMODB_ENDPOINT,
    )
