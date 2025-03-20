from fastapi import APIRouter, Depends, HTTPException
from app.auth.auth import current_active_user
from .init_tables import init_tables

router = APIRouter()


@router.post("/init-tables")
async def initialize_tables():
    try:
        result = await init_tables()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"テーブル初期化エラー: {str(e)}")
