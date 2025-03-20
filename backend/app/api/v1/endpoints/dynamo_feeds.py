from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
import logging
from app.auth.auth import current_active_user
from app.models.user import User
from app.schemas.feed import Feed, FeedCreate, FeedUpdate
from app.dynamodb.repositories.feeds import FeedRepository

logger = logging.getLogger(__name__)

router = APIRouter()


def get_feed_repository() -> FeedRepository:
    """フィードリポジトリを取得する依存性注入関数"""
    return FeedRepository()


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
