from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import requests
import logging
from app.database import get_async_session
from app.models.user import User
from app.auth.auth import current_active_user
from app import models, schemas

logger = logging.getLogger(__name__)

# RSS2JSONのエンドポイント
RSS2JSON_ENDPOINT = "https://api.rss2json.com/v1/api.json"

router = APIRouter()


@router.get("/", response_model=List[schemas.Feed])
async def get_feeds(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    logger.info(f"Getting feeds for user {user.email}")
    result = await session.execute(select(models.Feed))
    return result.scalars().all()


@router.post("/", response_model=schemas.Feed)
async def create_feed(
    feed: schemas.FeedCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    db_feed = models.Feed(**feed.dict())
    session.add(db_feed)
    await session.commit()
    await session.refresh(db_feed)
    return db_feed


@router.put("/{feed_id}", response_model=schemas.Feed)
async def update_feed(
    feed_id: int,
    feed_update: schemas.FeedUpdate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(models.Feed).filter(models.Feed.id == feed_id)
    )
    db_feed = result.scalar_one_or_none()
    if db_feed is None:
        raise HTTPException(status_code=404, detail="Feed not found")

    for key, value in feed_update.dict(exclude_unset=True).items():
        setattr(db_feed, key, value)

    await session.commit()
    await session.refresh(db_feed)
    return db_feed


@router.delete("/{feed_id}")
async def delete_feed(
    feed_id: int,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(models.Feed).filter(models.Feed.id == feed_id)
    )
    db_feed = result.scalar_one_or_none()
    if db_feed is None:
        raise HTTPException(status_code=404, detail="Feed not found")

    await session.delete(db_feed)
    await session.commit()
    return {"ok": True}


@router.get("/read-articles")
async def get_read_articles(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    query = select(models.ReadArticle.article_link).where(
        models.ReadArticle.user_id == user.id
    )
    result = await session.execute(query)
    read_articles = [row[0] for row in result.fetchall()]

    return {"read_articles": read_articles}


@router.post("/read-articles", response_model=schemas.ReadArticle)
async def mark_article_as_read(
    article: schemas.ReadArticleCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    # article.dictの内容にuser_idを追加
    article_data = article.dict()
    article_data["user_id"] = user.id

    db_article = models.ReadArticle(**article_data)
    session.add(db_article)
    await session.commit()
    await session.refresh(db_article)
    return db_article


@router.get("/parse-feed")
async def parse_feed(url: str = Query(...), user: User = Depends(current_active_user)):
    logger.info(f"Parsing feed: {url}")
    try:
        # RSS2JSONにリクエスト（API keyなし）
        params = {
            "rss_url": url,
        }

        response = requests.get(RSS2JSON_ENDPOINT, params=params)

        # RSS2JSONのレートリミットチェック
        if response.status_code == 429:
            logger.warning("Rate limit reached for RSS2JSON API")
            return {"status": "error", "code": 429, "message": "Rate limit exceeded"}

        response.raise_for_status()

        data = response.json()
        logger.debug(f"RSS2JSON response status: {data.get('status')}")

        if data["status"] != "ok":
            logger.error(f"RSS2JSON error: {data.get('message', 'Unknown error')}")
            raise HTTPException(status_code=500, detail="Failed to parse feed")

        # 記事データを整形
        articles = []
        for item in data.get("items", []):
            article = {
                "title": item.get("title", ""),
                "link": item.get("link", ""),
                "description": item.get("description", ""),
                "published": item.get("pubDate", datetime.now().isoformat()),
                "image": item.get("thumbnail", ""),
                "categories": item.get("categories", []),
            }
            articles.append(article)

        logger.info(f"Successfully processed {len(articles)} articles")
        return {"entries": articles, "status": "success", "feed": data.get("feed", {})}

    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error parsing feed: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))
