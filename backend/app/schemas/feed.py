from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


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
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReadArticleBase(BaseModel):
    article_link: str


class ReadArticleCreate(ReadArticleBase):
    pass


class ReadArticle(ReadArticleBase):
    id: int
    read_at: datetime
    user_id: int

    class Config:
        from_attributes = True


class FavoriteArticleBase(BaseModel):
    article_link: str
    article_title: str
    article_description: Optional[str] = None
    article_image: Optional[str] = None
    article_categories: Optional[List[str]] = []
    feed_id: Optional[int] = None
    is_external: bool = False


class FavoriteArticleCreate(FavoriteArticleBase):
    pass


class FavoriteArticle(FavoriteArticleBase):
    id: int
    user_id: int
    favorited_at: datetime

    class Config:
        from_attributes = True


class AiSummaryBase(BaseModel):
    feed_id: Optional[int] = None
    article_link: str


class AiSummaryCreate(AiSummaryBase):
    pass


class AiSummary(AiSummaryBase):
    id: int
    created_at: datetime
    summary: str

    class Config:
        from_attributes = True
