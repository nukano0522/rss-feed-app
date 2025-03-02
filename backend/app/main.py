from fastapi import FastAPI
from app.database import engine, Base
from app import models
import logging
from app.api.v1.router import api_router
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ライフスパンコンテキストマネージャ
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時の処理
    logger.info("アプリケーション起動中...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("データベース初期化完了")

    yield  # アプリケーションの実行

    # シャットダウン時の処理
    logger.info("アプリケーション終了中...")
    # 必要に応じてリソースのクリーンアップを行う


# FastAPIアプリケーションの作成
app = FastAPI(lifespan=lifespan)

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # 開発環境
        "http://rssfee-rssfe-uf6brkcl43tr-2147301523.ap-northeast-1.elb.amazonaws.com",  # 本番環境
        "https://app.nklifehub.com",
    ],
    allow_credentials=True,  # Cookie送信を許可
    allow_methods=["*"],
    allow_headers=["*"],
)


# APIルーターを追加
app.include_router(api_router, prefix="/api/v1")
