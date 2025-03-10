import os
import json
import logging
from mangum import Mangum
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3
from boto3.dynamodb.conditions import Key
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# ロギング設定
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# 環境変数
DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "production")
DOMAIN = os.environ.get("DOMAIN", "app.nklifehub.com")

# DynamoDB クライアント
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(DYNAMODB_TABLE)

# FastAPI アプリケーション
app = FastAPI(title="RSS Feed API", version="1.0.0")

# CORS設定
origins = [
    f"https://{DOMAIN}",
    "http://localhost:3000",  # 開発環境
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# モデル定義
class Feed(BaseModel):
    id: str
    name: str
    url: str
    enabled: bool = True
    default_image: Optional[str] = None
    created_at: str


class FeedCreate(BaseModel):
    name: str
    url: str
    default_image: Optional[str] = None


class ReadArticle(BaseModel):
    article_link: str


class FavoriteArticleRequest(BaseModel):
    article_link: str
    article_title: str
    article_description: Optional[str] = None
    article_image: Optional[str] = None
    article_categories: Optional[List[str]] = None
    feed_id: str


# ヘルパー関数
def get_user_id_from_request(request: Request) -> str:
    # 実際の認証ロジックに置き換える
    # 例: JWTトークンからユーザーIDを取得
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="認証が必要です")

    # ここでJWTトークンを検証してユーザーIDを取得
    # 簡略化のため、固定値を返す
    return "user123"


# エンドポイント
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "environment": ENVIRONMENT,
    }


@app.get("/api/v1/feeds", response_model=List[Feed])
async def get_feeds(request: Request):
    user_id = get_user_id_from_request(request)

    response = table.query(
        IndexName="UserIdIndex",
        KeyConditionExpression=Key("UserId").eq(user_id)
        & Key("SK").begins_with("FEED#"),
    )

    feeds = []
    for item in response.get("Items", []):
        feeds.append(
            Feed(
                id=item["PK"].split("#")[1],
                name=item["Name"],
                url=item["FeedUrl"],
                enabled=item.get("Enabled", True),
                default_image=item.get("DefaultImage"),
                created_at=item["CreatedAt"],
            )
        )

    return feeds


@app.post("/api/v1/feeds", response_model=Feed)
async def create_feed(feed: FeedCreate, request: Request):
    user_id = get_user_id_from_request(request)
    feed_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    item = {
        "PK": f"FEED#{feed_id}",
        "SK": f"FEED#{feed_id}",
        "UserId": user_id,
        "Name": feed.name,
        "FeedUrl": feed.url,
        "Enabled": True,
        "DefaultImage": feed.default_image,
        "CreatedAt": now,
        "Type": "Feed",
    }

    table.put_item(Item=item)

    return Feed(
        id=feed_id,
        name=feed.name,
        url=feed.url,
        enabled=True,
        default_image=feed.default_image,
        created_at=now,
    )


# Mangumハンドラー
handler = Mangum(app)
