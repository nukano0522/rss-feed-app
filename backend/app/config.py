import os
from dotenv import load_dotenv

load_dotenv()

# 環境設定
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
DEBUG = ENVIRONMENT.lower() in ["development", "local"]

# DynamoDB設定
DYNAMODB_ENDPOINT = os.getenv("DYNAMODB_ENDPOINT", "http://dynamodb-local:8000")
AWS_REGION = os.getenv("AWS_REGION", os.getenv("ENV_AWS_REGION", "ap-northeast-1"))
AWS_ACCESS_KEY_ID = os.getenv(
    "AWS_ACCESS_KEY_ID", os.getenv("ENV_AWS_ACCESS_KEY_ID", "dummy")
)
AWS_SECRET_ACCESS_KEY = os.getenv(
    "AWS_SECRET_ACCESS_KEY", os.getenv("ENV_AWS_SECRET_ACCESS_KEY", "dummy")
)
