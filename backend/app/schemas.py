from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FeedBase(BaseModel):
    name: str
    url: str
    default_image: Optional[str] = None
    enabled: bool = True


class FeedCreate(FeedBase):
    pass


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

    class Config:
        from_attributes = True
