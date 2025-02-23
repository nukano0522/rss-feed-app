from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# ECSの場合localhost, Docker Composeの場合db
# DATABASE_URL = "mysql+aiomysql://user:password@db:3306/rss_reader"
DATABASE_URL = "mysql+aiomysql://admin:4Cxr%3E%7C.0IPX%24kgETE%21y1.o%2B4d%2AmkS%3B%5Em@rssreaderrdsstack-rssreaderdatabase47848f56-ceihboypn9u7.cv6uaugkqe8s.ap-northeast-1.rds.amazonaws.com:3306/rss_reader"


class Base(DeclarativeBase):
    pass


engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
