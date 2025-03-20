import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()


def get_dynamodb_client():
    """DynamoDBクライアントを取得する"""
    try:
        # 環境変数の取得
        aws_region = os.getenv("ENV_AWS_REGION", "ap-northeast-1")
        aws_access_key_id = os.getenv("ENV_AWS_ACCESS_KEY_ID")
        aws_secret_access_key = os.getenv("ENV_AWS_SECRET_ACCESS_KEY")

        # ローカル環境の場合はローカルDynamoDBに接続
        environment = os.getenv("ENVIRONMENT", "development")
        endpoint_url = None

        if environment.lower() == "development" or environment.lower() == "local":
            endpoint_url = os.getenv("DYNAMODB_ENDPOINT", "http://dynamodb-local:8000")
            logger.info(f"ローカルDynamoDBに接続します: {endpoint_url}")

        # 明示的な設定でクライアントを作成
        config = Config(
            region_name=aws_region,
            signature_version="v4",
            retries={"max_attempts": 3},
        )

        # セッションを明示的に作成
        session = boto3.Session(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=aws_region,
            # 一時的な認証情報を使用しないように明示的にNoneを設定
            aws_session_token=None,
        )

        # セッションからクライアントを作成（ローカル環境の場合はエンドポイントを指定）
        client = session.client("dynamodb", config=config, endpoint_url=endpoint_url)

        return client
    except Exception as e:
        logger.error(f"DynamoDBクライアントの作成に失敗: {str(e)}")
        raise
