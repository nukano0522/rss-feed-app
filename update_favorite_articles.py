from app.db.session import engine
from sqlalchemy import text
import asyncio


async def update_records():
    async with engine.begin() as conn:
        result = await conn.execute(
            text(
                "UPDATE favorite_articles SET is_external = FALSE WHERE is_external IS NULL"
            )
        )
        print(f"Updated {result.rowcount} records with is_external = FALSE")


if __name__ == "__main__":
    asyncio.run(update_records())
