from fastapi import APIRouter, Depends, HTTPException
from app.auth.auth import current_active_user
from .init_tables import init_tables
import os
import boto3
import logging
from .client import (
    get_dynamodb_client,
    AWS_REGION,
    DYNAMODB_ENDPOINT,
    IS_PRODUCTION,
    ENVIRONMENT,
    AWS_ACCESS_KEY_ID,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/init-tables")
async def initialize_tables():
    try:
        result = await init_tables()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"テーブル初期化エラー: {str(e)}")


@router.get("/connection-test")
async def test_dynamodb_connection(
    # user=Depends(current_active_user)
):
    """DynamoDBの接続状態を確認するエンドポイント"""
    try:
        client = get_dynamodb_client()

        # テーブル一覧を取得
        tables = client.list_tables()

        # 接続情報とテーブル一覧を返却
        return {
            "status": "success",
            "message": "DynamoDBに正常に接続できました",
            "environment": ENVIRONMENT,
            "is_production": IS_PRODUCTION,
            "region": AWS_REGION,
            "endpoint": DYNAMODB_ENDPOINT,
            "tables": tables.get("TableNames", []),
            "aws_access_key_id": (
                AWS_ACCESS_KEY_ID[:4] + "..." if AWS_ACCESS_KEY_ID else None
            ),
        }
    except Exception as e:
        logger.error(f"DynamoDB接続エラー: {str(e)}")
        return {
            "status": "error",
            "message": f"DynamoDB接続エラー: {str(e)}",
            "environment": ENVIRONMENT,
            "is_production": IS_PRODUCTION,
            "region": AWS_REGION,
            "endpoint": DYNAMODB_ENDPOINT,
            "aws_access_key_id": (
                AWS_ACCESS_KEY_ID[:4] + "..." if AWS_ACCESS_KEY_ID else None
            ),
        }
