from fastapi import APIRouter, HTTPException
from botocore.exceptions import ClientError
import logging
from typing import Dict, Any
from app.dynamodb.client import get_dynamodb_client
from app.dynamodb.init_tables import init_tables

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/test-dynamodb")
async def test_dynamodb_connection() -> Dict[str, Any]:
    """DynamoDBへの接続をテストする"""
    try:
        client = get_dynamodb_client()
        # テーブル一覧を取得
        response = client.list_tables()
        return {
            "status": "success",
            "message": "DynamoDBに正常に接続できました",
            "tables": response.get("TableNames", []),
        }
    except ClientError as e:
        logger.error(f"DynamoDB接続エラー: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"DynamoDBへの接続に失敗しました: {str(e)}"
        )
    except Exception as e:
        logger.error(f"予期せぬエラー: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"予期せぬエラーが発生しました: {str(e)}"
        )


@router.post("/init-tables")
async def initialize_tables() -> Dict[str, Any]:
    """DynamoDBのテーブルを初期化する"""
    try:
        init_tables()

        # テーブル一覧を取得して確認
        client = get_dynamodb_client()
        tables = client.list_tables().get("TableNames", [])

        return {
            "status": "success",
            "message": "テーブルの初期化が完了しました",
            "tables": tables,
        }
    except ClientError as e:
        logger.error(f"テーブル初期化エラー: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"テーブルの初期化に失敗しました: {str(e)}"
        )
    except Exception as e:
        logger.error(f"予期せぬエラー: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"予期せぬエラーが発生しました: {str(e)}"
        )
