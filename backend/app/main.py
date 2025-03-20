from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware
import os

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# アプリケーション作成関数
def get_application():
    # FastAPIアプリケーションの作成（lifespanなし）
    app = FastAPI()

    # CORSミドルウェアの設定
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://rssfee-rssfe-uf6brkcl43tr-2147301523.ap-northeast-1.elb.amazonaws.com",
            "https://app.nklifehub.com",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 最小限のヘルスチェックエンドポイント
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    # 必要に応じて他のルーターを遅延ロード
    @app.on_event("startup")
    async def load_routes():
        try:
            # APIルーターのインポートと登録
            from app.api.v1.router import api_router

            app.include_router(api_router, prefix="/api/v1")
            logger.info("APIルーターが正常に登録されました")

            # SQLデータベース初期化
            try:
                from app.database import engine, Base, get_async_session
                from app import models
                from sqlalchemy import select
                from sqlalchemy.ext.asyncio import AsyncSession

                async with engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)
                logger.info("SQLデータベーステーブルが正常に初期化されました")
            except Exception as db_error:
                logger.error(
                    f"SQLデータベース初期化中にエラーが発生しました: {str(db_error)}"
                )
                # データベースエラーでもアプリケーションは起動させる

            # DynamoDBテーブル初期化
            try:
                from app.dynamodb.init_tables import init_tables

                logger.info("DynamoDBテーブルの初期化を開始します...")
                result = await init_tables()
                logger.info(f"DynamoDBテーブル初期化結果: {result}")
            except Exception as dynamo_error:
                logger.error(
                    f"DynamoDBテーブル初期化中にエラーが発生しました: {str(dynamo_error)}"
                )
                # エラーでもアプリケーションは起動させる

        except Exception as e:
            logger.error(f"アプリケーション起動中にエラーが発生しました: {str(e)}")
            # エラーが発生してもアプリケーションは起動させる

    return app


# 直接実行された場合のエントリーポイント
app = get_application()
