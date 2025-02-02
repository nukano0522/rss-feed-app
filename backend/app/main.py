from fastapi import FastAPI
from app.database import engine, Base
from app import models
import logging
from app.api.v1.router import api_router
from fastapi.middleware.cors import CORSMiddleware

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPIアプリケーションの作成
app = FastAPI()

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのオリジン
    allow_credentials=True,  # Cookie送信を許可
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターを追加
app.include_router(api_router, prefix="/api/v1")


# データベースの初期化
@app.on_event("startup")
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
