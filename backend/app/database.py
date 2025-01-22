from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import time
from sqlalchemy.exc import OperationalError

DATABASE_URL = os.getenv("DATABASE_URL")


def get_engine(retries=5, delay=2):
    for attempt in range(retries):
        try:
            engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 10},
            )
            # テスト接続を試みる（text()を使用して正しくSQLを実行）
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
                connection.commit()
            return engine
        except OperationalError as e:
            if attempt == retries - 1:  # 最後の試行の場合
                raise e
            time.sleep(delay)  # 次の試行まで待機


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
