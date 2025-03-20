from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any, Union


class FeedBase(BaseModel):
    name: str
    url: str
    enabled: bool = True
    default_image: Optional[str] = None


class FeedCreate(FeedBase):
    pass


class FeedUpdate(FeedBase):
    name: Optional[str] = None
    url: Optional[str] = None
    enabled: Optional[bool] = None
    default_image: Optional[str] = None


class Feed(FeedBase):
    """互換性のために残すSQLAlchemy向けモデル"""

    id: Union[int, str]  # intまたはstr(UUID)を受け入れる
    created_at: Union[datetime, str]  # datetimeまたはISOフォーマット文字列を受け入れる

    class Config:
        from_attributes = True


class ReadArticleBase(BaseModel):
    article_link: str


class ReadArticleCreate(ReadArticleBase):
    pass


class ReadArticle(ReadArticleBase):
    id: Union[int, str]  # intまたはstr(UUID)を受け入れる
    read_at: Union[datetime, str]  # datetimeまたはISOフォーマット文字列を受け入れる
    user_id: Union[int, str]  # intまたはstr(UUID)を受け入れる

    class Config:
        from_attributes = True


class FavoriteArticleBase(BaseModel):
    article_link: str
    article_title: str
    article_description: Optional[str] = None
    article_image: Optional[str] = None
    article_categories: Optional[List[str]] = []
    feed_id: Optional[Union[int, str]] = "aaa"
    is_external: bool = False


class FavoriteArticleCreate(FavoriteArticleBase):
    pass


class FavoriteArticle(FavoriteArticleBase):
    id: Union[int, str]  # intまたはstr(UUID)を受け入れる
    user_id: Union[int, str]  # intまたはstr(UUID)を受け入れる
    favorited_at: Union[
        datetime, str
    ]  # datetimeまたはISOフォーマット文字列を受け入れる

    class Config:
        from_attributes = True


class AiSummaryBase(BaseModel):
    feed_id: Optional[Union[int, str]] = None
    article_link: str


class AiSummaryCreate(AiSummaryBase):
    pass


class AiSummary(AiSummaryBase):
    id: Union[int, str]  # intまたはstr(UUID)を受け入れる
    created_at: Union[datetime, str]  # datetimeまたはISOフォーマット文字列を受け入れる
    summary: str

    class Config:
        from_attributes = True
