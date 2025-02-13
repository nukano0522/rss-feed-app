"""add_article_description_to_favorite_articles

Revision ID: 48ed5c5da985
Revises: previous_revision_id
Create Date: 2024-02-xx xx:xx:xx.xxx

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "48ed5c5da985"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.execute(
        "ALTER TABLE favorite_articles ADD COLUMN article_description TEXT NULL AFTER article_title"
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("favorite_articles", "article_description")
    # ### end Alembic commands ###
