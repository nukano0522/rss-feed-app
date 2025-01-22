from pydantic import BaseModel
from datetime import datetime
from typing import Optional


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
