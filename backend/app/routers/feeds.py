from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..database import get_async_session
from ..models.user import User
from ..auth.auth import current_active_user
from .. import models, schemas
import logging

router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)


@router.get("/feeds", response_model=List[schemas.Feed])
async def get_feeds(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    logger.info(f"Getting feeds for user {user.email}")
    result = await session.execute(
        select(models.Feed).order_by(models.Feed.created_at.desc())
    )
    feeds = result.scalars().all()
    return feeds


@router.post("/feeds", response_model=schemas.Feed)
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


@router.put("/feeds/{feed_id}", response_model=schemas.Feed)
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


@router.delete("/feeds/{feed_id}")
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


@router.post("/read-articles", response_model=schemas.ReadArticle)
async def mark_article_as_read(
    article: schemas.ReadArticleCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    db_article = models.ReadArticle(**article.dict())
    session.add(db_article)
    await session.commit()
    await session.refresh(db_article)
    return db_article
