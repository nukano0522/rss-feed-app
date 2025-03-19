from fastapi import APIRouter, HTTPException
import boto3
from botocore.exceptions import ClientError
import os
from typing import Dict, Any
import logging
from dotenv import load_dotenv
from botocore.config import Config

router = APIRouter()
logger = logging.getLogger(__name__)

load_dotenv()

print(f"AWS_REGION: {os.getenv('ENV_AWS_REGION')}")
print(f"AWS_ACCESS_KEY_ID: {os.getenv('ENV_AWS_ACCESS_KEY_ID')}")
print(f"AWS_SECRET_ACCESS_KEY: {os.getenv('ENV_AWS_SECRET_ACCESS_KEY')}")
print(f"ENVIRONMENT: {os.getenv('ENVIRONMENT')}")
print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")


def get_dynamodb_client():
    """DynamoDBクライアントを取得する"""
    try:
        # 明示的な設定でクライアントを作成
        config = Config(
            region_name=os.getenv("ENV_AWS_REGION", "ap-northeast-1"),
            signature_version="v4",
            retries={"max_attempts": 3},
        )

        # セッションを明示的に作成
        session = boto3.Session(
            aws_access_key_id=os.getenv("ENV_AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("ENV_AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("ENV_AWS_REGION", "ap-northeast-1"),
            # 一時的な認証情報を使用しないように明示的にNoneを設定
            aws_session_token=None,
        )

        # セッションからクライアントを作成
        client = session.client("dynamodb", config=config)

        return client
    except Exception as e:
        logger.error(f"DynamoDBクライアントの作成に失敗: {str(e)}")
        raise


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
