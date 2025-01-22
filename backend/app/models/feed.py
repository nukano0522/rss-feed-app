from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from ..database import Base


class Feed(Base):
    __tablename__ = "feeds"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    url = Column(String(2083), nullable=False)
    enabled = Column(Boolean, default=True)
    default_image = Column(String(2083), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# Userが読んだ記事
class ReadArticle(Base):
    __tablename__ = "read_articles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_link = Column(String(2083), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
