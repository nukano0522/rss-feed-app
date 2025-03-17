from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Text,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from sqlalchemy.dialects.postgresql import JSON


class Feed(Base):
    __tablename__ = "feeds"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    url = Column(String(512), nullable=False)
    enabled = Column(Boolean, default=True)
    default_image = Column(String(2083), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# Userが読んだ記事
class ReadArticle(Base):
    __tablename__ = "read_articles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_link = Column(String(512), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)


class FavoriteArticle(Base):
    __tablename__ = "favorite_articles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    feed_id = Column(Integer, ForeignKey("feeds.id"), nullable=True)
    article_link = Column(String(767), nullable=False)
    article_title = Column(String(512), nullable=False)
    article_description = Column(Text, nullable=True)
    article_image = Column(String(2083), nullable=True)
    article_categories = Column(JSON, nullable=True)
    favorited_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    is_external = Column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint("article_link", "user_id", name="uq_favorite_article_user"),
    )


class AiSummary(Base):
    __tablename__ = "ai_summaries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    feed_id = Column(Integer, ForeignKey("feeds.id"), nullable=False)
    article_link = Column(String(512), nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("feed_id", "article_link", name="uq_feed_article_summary"),
    )
