from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os
import logging

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# .envファイルの読み込み
load_dotenv()

# 環境変数からENVIRONMENTを取得（デフォルトは'development'）
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DATABASE_URL = os.getenv("DATABASE_URL")
logger.info(f"Current environment: {ENVIRONMENT}")
logger.info(f"Using database URL: {DATABASE_URL}")

# データベースURLの修正
if DATABASE_URL:
    # mysql://形式をmysql+aiomysql://に変換
    if DATABASE_URL.startswith("mysql://"):
        DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+aiomysql://")
        logger.info(f"Modified URL to use aiomysql: {DATABASE_URL}")

    # mysqlclient形式をaiomysqlに変換
    elif DATABASE_URL.startswith("mysql+mysqlclient://"):
        DATABASE_URL = DATABASE_URL.replace("mysql+mysqlclient://", "mysql+aiomysql://")
        logger.info(f"Changed from mysqlclient to aiomysql: {DATABASE_URL}")
else:
    logger.error("DATABASE_URL is not set in environment variables")
    raise ValueError("DATABASE_URL is not set")


class Base(DeclarativeBase):
    pass


# 遅延初期化のためのシングルトンパターン
_engine = None
_async_session_maker = None


def get_engine():
    global _engine
    if _engine is None:
        logger.info("Creating database engine...")
        try:
            _engine = create_async_engine(
                DATABASE_URL,
                echo=False,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 30},
            )
            logger.info("Database engine created successfully")
        except Exception as e:
            logger.error(f"Error creating database engine: {str(e)}")
            raise
    return _engine


def get_session_maker():
    global _async_session_maker
    if _async_session_maker is None:
        logger.info("Creating session maker...")
        try:
            _async_session_maker = sessionmaker(
                get_engine(), class_=AsyncSession, expire_on_commit=False
            )
            logger.info("Session maker created successfully")
        except Exception as e:
            logger.error(f"Error creating session maker: {str(e)}")
            raise
    return _async_session_maker


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """非同期セッションを取得する関数"""
    try:
        logger.info("Getting async session...")
        session_maker = get_session_maker()
        async with session_maker() as session:
            logger.info("Async session created successfully")
            yield session
    except Exception as e:
        logger.error(f"Error creating async session: {str(e)}")
        raise


# 外部からアクセスするためのエンジンとセッションメーカーのエクスポート
engine = get_engine()
async_session_maker = get_session_maker()
