from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Feed(Base):
    __tablename__ = "feeds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    default_image = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReadArticle(Base):
    __tablename__ = "read_articles"

    id = Column(Integer, primary_key=True, index=True)
    article_link = Column(String, nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow)
