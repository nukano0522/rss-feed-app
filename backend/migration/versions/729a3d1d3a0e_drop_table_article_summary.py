"""drop table article-summary

Revision ID: 729a3d1d3a0e
Revises: a1a849c2d2c5
Create Date: 2025-02-17 08:02:28.594848

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = "729a3d1d3a0e"
down_revision: Union[str, None] = "a1a849c2d2c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index("article_link", table_name="article_summaries")
    op.drop_index("ix_article_summaries_id", table_name="article_summaries")
    op.drop_table("article_summaries")
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "article_summaries",
        sa.Column("id", mysql.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("article_link", mysql.VARCHAR(length=767), nullable=False),
        sa.Column("summary", mysql.TEXT(), nullable=False),
        sa.Column("created_at", mysql.DATETIME(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        mysql_collate="utf8mb4_0900_ai_ci",
        mysql_default_charset="utf8mb4",
        mysql_engine="InnoDB",
    )
    op.create_index(
        "ix_article_summaries_id", "article_summaries", ["id"], unique=False
    )
    op.create_index("article_link", "article_summaries", ["article_link"], unique=True)
    # ### end Alembic commands ###
