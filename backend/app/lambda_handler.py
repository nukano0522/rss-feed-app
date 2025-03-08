import json
from mangum import Mangum
import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# グローバル変数としてアプリケーションを保持
app = None


def get_application():
    """FastAPIアプリケーションを初期化して返す"""
    global app

    if app is not None:
        return app

    logger.info("FastAPIアプリケーションを初期化中...")

    # FastAPIアプリケーションの作成
    app = FastAPI(title="RSS Feed API")

    # CORSミドルウェアの設定
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 本番環境では適切に制限すること
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # グローバルな例外ハンドラー
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        error_detail = {"message": "Internal Server Error", "detail": str(exc)}
        logger.error(f"グローバル例外ハンドラー: {error_detail}")
        return JSONResponse(
            status_code=500,
            content=error_detail,
        )

    # APIルーターの初期化
    try:
        # APIルーターのインポートと登録
        from app.api.v1.router import api_router

        app.include_router(api_router, prefix="/api/v1")

        logger.info("APIルーターが正常に初期化されました")
    except Exception as e:
        logger.error(f"ルーターの初期化中にエラーが発生しました: {str(e)}")
        # エラーが発生してもアプリケーションは返す（ヘルスチェックは動作させる）

    return app


# Lambdaハンドラー関数
def handler(event, context):
    """AWS Lambda用のハンドラー関数"""
    logger.info(
        f"Lambdaハンドラーが呼び出されました: {event.get('path', 'unknown path')}"
    )

    # ヘルスチェックの場合は即時レスポンス
    if event.get("path") == "/health" and event.get("httpMethod") == "GET":
        logger.info("ヘルスチェックリクエストを処理")
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"status": "healthy"}),
        }

    # 通常のリクエスト処理
    try:
        application = get_application()
        asgi_handler = Mangum(application, lifespan="off")
        return asgi_handler(event, context)
    except Exception as e:
        logger.error(f"リクエスト処理中にエラーが発生しました: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": f"Internal Server Error: {str(e)}"}),
        }
