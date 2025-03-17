from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Callable
from datetime import datetime
import logging
from app.database import get_async_session
from app.models.user import User
from app.auth.auth import current_active_user
from app import models, schemas
from base64 import b64decode
import aiohttp
from app.utils.content_extractor import ContentExtractor
from app.utils.metadata_extractor import MetadataExtractor
from app.utils.summarizer import ArticleSummarizer

logger = logging.getLogger(__name__)

# RSS2JSONのエンドポイント
RSS2JSON_ENDPOINT = "https://api.rss2json.com/v1/api.json"

router = APIRouter()


# 依存性注入のための関数
def get_content_extractor() -> ContentExtractor:
    return ContentExtractor()


def get_metadata_extractor() -> MetadataExtractor:
    return MetadataExtractor()


def get_summarizer() -> ArticleSummarizer:
    return ArticleSummarizer()


@router.get("", response_model=List[schemas.Feed])
async def get_feeds(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    logger.info(f"Getting feeds for user {user.email}")
    result = await session.execute(select(models.Feed))
    return result.scalars().all()


@router.post("", response_model=schemas.Feed)
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

        async with aiohttp.ClientSession() as session:
            async with session.get(RSS2JSON_ENDPOINT, params=params) as response:
                # RSS2JSONのレートリミットチェック
                if response.status == 429:
                    logger.warning("Rate limit reached for RSS2JSON API")
                    return {
                        "status": "error",
                        "code": 429,
                        "message": "Rate limit exceeded",
                    }

                response.raise_for_status()
                data = await response.json()

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
                "published": item.get("pubDate")
                or item.get("dc:date")
                or item.get("date")
                or item.get("published")
                or datetime.now().isoformat(),
                "image": item.get("thumbnail", ""),
                "categories": item.get("categories", []),
            }
            articles.append(article)

        logger.info(f"Successfully processed {len(articles)} articles")
        return {"entries": articles, "status": "success", "feed": data.get("feed", {})}

    except aiohttp.ClientError as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error parsing feed: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/favorite-articles", response_model=schemas.FavoriteArticle)
async def add_favorite_article(
    article: schemas.FavoriteArticleCreate,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    """記事をお気に入りに追加"""
    try:
        # 外部記事の場合はフィード確認をスキップ
        if article.feed_id is not None and not article.is_external:
            # フィードの存在確認
            feed_result = await session.execute(
                select(models.Feed).filter(models.Feed.id == article.feed_id)
            )
            feed = feed_result.scalar_one_or_none()
            if not feed:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="指定されたフィードが見つかりません",
                )

        new_favorite = models.FavoriteArticle(
            article_link=article.article_link,
            article_title=article.article_title,
            article_description=article.article_description,
            article_image=article.article_image,
            article_categories=article.article_categories or [],
            feed_id=article.feed_id,
            user_id=user.id,
            is_external=article.is_external,
        )
        session.add(new_favorite)
        await session.commit()
        await session.refresh(new_favorite)
        return new_favorite
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        if "uq_favorite_article_user" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="この記事は既にお気に入りに登録されています",
            )
        logger.error(f"Error adding favorite article: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="お気に入り登録中にエラーが発生しました",
        )


@router.delete(
    "/favorite-articles/{article_link}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_favorite_article(
    article_link: str,
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    """お気に入りから記事を削除"""
    try:
        # Base64デコードしてURLを復元
        decoded_link = b64decode(article_link).decode("utf-8")

        result = await session.execute(
            delete(models.FavoriteArticle).where(
                models.FavoriteArticle.article_link == decoded_link,
                models.FavoriteArticle.user_id == user.id,
            )
        )
        await session.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="お気に入りの記事が見つかりません",
            )
    except Exception as e:
        logger.error(f"Error removing favorite article: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="無効なURLフォーマットです"
        )


@router.get("/favorite-articles", response_model=List[schemas.FavoriteArticle])
async def get_favorite_articles(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    """ユーザーのお気に入り記事一覧を取得"""
    result = await session.execute(
        select(models.FavoriteArticle)
        .where(models.FavoriteArticle.user_id == user.id)
        .order_by(models.FavoriteArticle.favorited_at.desc())
    )
    return result.scalars().all()


@router.get("/favorite-articles/check", response_model=List[str])
async def check_favorite_articles(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    """ユーザーのお気に入り記事のリンク一覧を取得（チェック用）"""
    result = await session.execute(
        select(models.FavoriteArticle.article_link).where(
            models.FavoriteArticle.user_id == user.id
        )
    )
    return [row[0] for row in result.all()]


@router.post("/articles/summarize", response_model=schemas.AiSummary)
async def summarize_article(
    article: schemas.AiSummaryCreate,
    lang: str = Query("ja", description="要約の言語（ja/en）"),
    session: AsyncSession = Depends(get_async_session),
    content_extractor: ContentExtractor = Depends(get_content_extractor),
    summarizer: ArticleSummarizer = Depends(get_summarizer),
):
    # 外部記事の場合は feed_id を None として扱う
    feed_id = None if article.feed_id == 0 else article.feed_id

    # 既存の要約をチェック
    query = select(models.AiSummary).where(
        models.AiSummary.article_link == article.article_link
    )
    if feed_id is not None:
        query = query.where(models.AiSummary.feed_id == feed_id)
    else:
        query = query.where(models.AiSummary.feed_id.is_(None))

    existing_summary = await session.execute(query)
    summary = existing_summary.scalar_one_or_none()
    if summary:
        return summary

    try:
        # 記事本文の取得
        async with aiohttp.ClientSession() as client:
            async with client.get(article.article_link) as response:
                html = await response.text()

        # HTMLから本文を抽出
        article_text = content_extractor.extract_main_content(
            html, article.article_link
        )

        # GPTによる要約生成
        summary_text = await summarizer.summarize(article_text, lang)

        # 要約をDBに保存
        new_summary = models.AiSummary(
            feed_id=feed_id,
            article_link=article.article_link,
            summary=summary_text,
        )
        session.add(new_summary)
        await session.commit()
        await session.refresh(new_summary)

        return new_summary

    except Exception as e:
        logger.error(f"Error summarizing article: {str(e)}")
        raise HTTPException(status_code=500, detail="記事の要約に失敗しました")


@router.get("/extract-metadata")
async def extract_metadata(
    url: str = Query(..., description="メタデータを抽出するURL"),
    user: User = Depends(current_active_user),
    metadata_extractor: MetadataExtractor = Depends(get_metadata_extractor),
):
    """URLからメタデータ（タイトル、説明、画像など）を抽出"""
    try:
        # 記事の取得
        async with aiohttp.ClientSession() as client:
            async with client.get(url) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"URLにアクセスできません: {response.status}",
                    )
                html = await response.text()

        # メタデータの抽出
        metadata = metadata_extractor.extract_metadata(html, url)

        return {
            "title": metadata.get("title", ""),
            "description": metadata.get("description", ""),
            "image": metadata.get("image", ""),
            "categories": metadata.get("keywords", []),
        }
    except aiohttp.ClientError as e:
        logger.error(f"URL取得エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"URLにアクセスできません: {str(e)}",
        )
    except Exception as e:
        logger.error(f"メタデータ抽出エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"メタデータの抽出に失敗しました: {str(e)}",
        )
