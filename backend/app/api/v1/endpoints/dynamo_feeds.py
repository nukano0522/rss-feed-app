from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Dict, Any
import logging
import aiohttp
from datetime import datetime
from base64 import b64decode
from app.auth.auth import current_active_user
from app.models.user import User
from app.schemas.feed import (
    Feed,
    FeedCreate,
    FeedUpdate,
    ReadArticle,
    ReadArticleCreate,
    FavoriteArticle,
    FavoriteArticleCreate,
)
from app.dynamodb.repositories.feeds import FeedRepository
from app.dynamodb.repositories.read_articles import ReadArticleRepository
from app.dynamodb.repositories.favorite_articles import FavoriteArticleRepository

logger = logging.getLogger(__name__)

router = APIRouter()

# RSS2JSONのエンドポイント
RSS2JSON_ENDPOINT = "https://api.rss2json.com/v1/api.json"


def get_feed_repository() -> FeedRepository:
    """フィードリポジトリを取得する依存性注入関数"""
    return FeedRepository()


def get_read_article_repository() -> ReadArticleRepository:
    """既読記事リポジトリを取得する依存性注入関数"""
    return ReadArticleRepository()


def get_favorite_article_repository() -> FavoriteArticleRepository:
    """お気に入り記事リポジトリを取得する依存性注入関数"""
    return FavoriteArticleRepository()


@router.get("/favorite-articles", response_model=List[FavoriteArticle])
async def get_favorite_articles(
    user: User = Depends(current_active_user),
    favorite_article_repository: FavoriteArticleRepository = Depends(
        get_favorite_article_repository
    ),
):
    """ユーザーのお気に入り記事一覧を取得"""
    try:
        logger.info(f"ユーザー {user.id} のお気に入り記事を取得します")
        favorite_articles = (
            await favorite_article_repository.get_favorite_articles_by_user(user.id)
        )

        if not favorite_articles:
            logger.info(f"ユーザー {user.id} のお気に入り記事は見つかりませんでした")
            return []

        return favorite_articles
    except Exception as e:
        logger.error(f"お気に入り記事取得エラー: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"お気に入り記事の取得中にエラーが発生しました: {str(e)}",
        )


@router.get("/favorite-articles/check", response_model=List[str])
async def check_favorite_articles(
    user: User = Depends(current_active_user),
    favorite_article_repository: FavoriteArticleRepository = Depends(
        get_favorite_article_repository
    ),
):
    """ユーザーのお気に入り記事のリンク一覧を取得（チェック用）"""
    try:
        favorite_links = await favorite_article_repository.check_favorite_articles(
            user.id
        )
        return favorite_links
    except Exception as e:
        logger.error(f"お気に入り記事リンク一覧取得エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"お気に入り記事リンク一覧の取得中にエラーが発生しました: {str(e)}",
        )


@router.post("/favorite-articles", response_model=FavoriteArticle)
async def add_favorite_article(
    article: FavoriteArticleCreate,
    user: User = Depends(current_active_user),
    favorite_article_repository: FavoriteArticleRepository = Depends(
        get_favorite_article_repository
    ),
    feed_repository: FeedRepository = Depends(get_feed_repository),
):
    """記事をお気に入りに追加"""
    try:
        # 外部記事の場合はフィード確認をスキップ
        if article.feed_id is not None and not article.is_external:
            # フィードの存在確認
            feed = await feed_repository.get_feed_by_id(article.feed_id)
            if not feed:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="指定されたフィードが見つかりません",
                )

        new_favorite = await favorite_article_repository.add_favorite_article(
            article, user.id
        )
        return new_favorite
    except ValueError as ve:
        # 既存登録エラー
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"お気に入り記事追加エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"お気に入り登録中にエラーが発生しました: {str(e)}",
        )


@router.delete(
    "/favorite-articles/{article_link}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_favorite_article(
    article_link: str,
    user: User = Depends(current_active_user),
    favorite_article_repository: FavoriteArticleRepository = Depends(
        get_favorite_article_repository
    ),
):
    """お気に入りから記事を削除"""
    try:
        # Base64デコードしてURLを復元
        decoded_link = b64decode(article_link).decode("utf-8")

        await favorite_article_repository.remove_favorite_article(decoded_link, user.id)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve),
        )
    except Exception as e:
        logger.error(f"お気に入り記事削除エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"お気に入り削除中にエラーが発生しました: {str(e)}",
        )


@router.get("/read-articles", response_model=dict)
async def get_read_articles(
    user: User = Depends(current_active_user),
    read_article_repository: ReadArticleRepository = Depends(
        get_read_article_repository
    ),
):
    """ユーザーの既読記事リンクリストを取得"""
    try:
        read_articles = await read_article_repository.get_all_read_articles_by_user(
            user.id
        )
        return {"read_articles": read_articles}
    except Exception as e:
        logger.error(f"既読記事取得エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"既読記事の取得中にエラーが発生しました: {str(e)}",
        )


@router.post("/read-articles", response_model=ReadArticle)
async def mark_article_as_read(
    article: ReadArticleCreate,
    user: User = Depends(current_active_user),
    read_article_repository: ReadArticleRepository = Depends(
        get_read_article_repository
    ),
):
    """記事を既読としてマークする"""
    try:
        read_article = await read_article_repository.mark_article_as_read(
            article, user.id
        )
        return read_article
    except Exception as e:
        logger.error(f"既読記事作成エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"既読記事の作成中にエラーが発生しました: {str(e)}",
        )


@router.get("/parse-feed")
async def parse_feed(url: str = Query(...), user: User = Depends(current_active_user)):
    """RSSフィードを解析するエンドポイント"""
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


@router.get("", response_model=List[Feed])
async def get_feeds(
    user: User = Depends(current_active_user),
    feed_repository: FeedRepository = Depends(get_feed_repository),
):
    """すべてのフィードを取得"""
    logger.info(f"Getting feeds for user {user.email}")
    try:
        feeds = await feed_repository.get_all_feeds()
        return feeds
    except Exception as e:
        logger.error(f"フィード取得エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"フィードの取得中にエラーが発生しました: {str(e)}",
        )


@router.get("/{feed_id}", response_model=Feed)
async def get_feed(
    feed_id: str,
    user: User = Depends(current_active_user),
    feed_repository: FeedRepository = Depends(get_feed_repository),
):
    """IDでフィードを取得"""
    logger.info(f"Getting feed {feed_id} for user {user.email}")
    try:
        feed = await feed_repository.get_feed_by_id(feed_id)
        if not feed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="フィードが見つかりません",
            )
        return feed
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"フィード取得エラー (ID: {feed_id}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"フィードの取得中にエラーが発生しました: {str(e)}",
        )


@router.post("", response_model=Feed, status_code=status.HTTP_201_CREATED)
async def create_feed(
    feed: FeedCreate,
    user: User = Depends(current_active_user),
    feed_repository: FeedRepository = Depends(get_feed_repository),
):
    """新しいフィードを作成"""
    logger.info(f"Creating feed for user {user.email}")
    try:
        created_feed = await feed_repository.create_feed(feed)
        return created_feed
    except Exception as e:
        logger.error(f"フィード作成エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"フィードの作成中にエラーが発生しました: {str(e)}",
        )


@router.put("/{feed_id}", response_model=Feed)
async def update_feed(
    feed_id: str,
    feed_update: FeedUpdate,
    user: User = Depends(current_active_user),
    feed_repository: FeedRepository = Depends(get_feed_repository),
):
    """フィードを更新"""
    logger.info(f"Updating feed {feed_id} for user {user.email}")
    try:
        # フィードが存在するか確認
        feed = await feed_repository.get_feed_by_id(feed_id)
        if not feed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="フィードが見つかりません",
            )

        # 更新を実行
        updated_feed = await feed_repository.update_feed(feed_id, feed_update)
        return updated_feed
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"フィード更新エラー (ID: {feed_id}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"フィードの更新中にエラーが発生しました: {str(e)}",
        )


@router.delete("/{feed_id}")
async def delete_feed(
    feed_id: str,
    user: User = Depends(current_active_user),
    feed_repository: FeedRepository = Depends(get_feed_repository),
):
    """フィードを削除"""
    logger.info(f"Deleting feed {feed_id} for user {user.email}")
    try:
        # フィードが存在するか確認
        feed = await feed_repository.get_feed_by_id(feed_id)
        if not feed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="フィードが見つかりません",
            )

        # 削除を実行
        await feed_repository.delete_feed(feed_id)
        return {"ok": True, "message": "フィードが正常に削除されました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"フィード削除エラー (ID: {feed_id}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"フィードの削除中にエラーが発生しました: {str(e)}",
        )
