from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from sqlalchemy.orm import Session
from . import models
from . import schemas
from .database import SessionLocal, engine
from typing import List, Optional
import logging
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# データベースのテーブルを作成
models.Base.metadata.create_all(bind=engine)

# FastAPIアプリケーションの作成
app = FastAPI()
router = APIRouter(prefix="/api")

# ロガーの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORSミドルウェアの設定
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

RSS2JSON_ENDPOINT = "https://api.rss2json.com/v1/api.json"


# データベース依存性
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/api/feeds", response_model=List[schemas.Feed])
async def get_feeds(db: Session = Depends(get_db)):
    logger.info("Getting all feeds")
    return db.query(models.Feed).all()


@app.post("/api/feeds", response_model=schemas.Feed)
async def create_feed(feed: schemas.FeedCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating new feed: {feed.dict()}")
    try:
        db_feed = models.Feed(**feed.dict())
        db.add(db_feed)
        db.commit()
        db.refresh(db_feed)
        logger.info(f"Feed created successfully: {db_feed.id}")
        return db_feed
    except Exception as e:
        logger.error(f"Error creating feed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/feeds/{feed_id}", response_model=schemas.Feed)
async def update_feed(
    feed_id: int, feed: schemas.FeedCreate, db: Session = Depends(get_db)
):
    logger.info(f"Updating feed {feed_id}")
    db_feed = db.query(models.Feed).filter(models.Feed.id == feed_id).first()
    if db_feed is None:
        raise HTTPException(status_code=404, detail="Feed not found")
    for key, value in feed.dict().items():
        setattr(db_feed, key, value)
    db.commit()
    return db_feed


@app.delete("/api/feeds/{feed_id}")
async def delete_feed(feed_id: int, db: Session = Depends(get_db)):
    logger.info(f"Deleting feed {feed_id}")
    db_feed = db.query(models.Feed).filter(models.Feed.id == feed_id).first()
    if db_feed is None:
        raise HTTPException(status_code=404, detail="Feed not found")
    db.delete(db_feed)
    db.commit()
    return {"ok": True}


@router.get("/parse-feed")
async def parse_feed(url: str = Query(...)):
    logger.info(f"Parsing feed: {url}")
    try:
        # RSS2JSONにリクエスト（API keyなし）
        params = {
            "rss_url": url,
            # "count": 20,
            # "format": "json"
        }  # 取得する記事数

        response = requests.get(RSS2JSON_ENDPOINT, params=params)

        # RSS2JSONのレートリミットチェック
        if response.status_code == 429:
            logger.warning("Rate limit reached for RSS2JSON API")
            return {"status": "error", "code": 429, "message": "Rate limit exceeded"}

        response.raise_for_status()

        data = response.json()
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
                "published": item.get("pubDate", datetime.now().isoformat()),
                "image": item.get("thumbnail", ""),
                "categories": item.get("categories", []),
            }
            articles.append(article)

        logger.info(f"Successfully processed {len(articles)} articles")
        return {"entries": articles, "status": "success", "feed": data.get("feed", {})}

    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error parsing feed: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))


# 既存のエンドポイントはそのまま維持
app.include_router(router)
