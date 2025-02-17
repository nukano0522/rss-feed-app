"""add ai-summary table

Revision ID: a1a849c2d2c5
Revises: 0a6198a15623
Create Date: 2025-02-17 07:05:51.337967

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1a849c2d2c5"
down_revision: Union[str, None] = "0a6198a15623"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "ai_summaries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("feed_id", sa.Integer(), nullable=False),
        sa.Column("article_link", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["feed_id"],
            ["feeds.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("feed_id", "article_link", name="uq_feed_article_summary"),
    )
    op.create_index(op.f("ix_ai_summaries_id"), "ai_summaries", ["id"], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f("ix_ai_summaries_id"), table_name="ai_summaries")
    op.drop_table("ai_summaries")
    # ### end Alembic commands ###
