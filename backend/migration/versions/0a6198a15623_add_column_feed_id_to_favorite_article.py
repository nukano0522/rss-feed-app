"""add column feed_id to favorite_article

Revision ID: 0a6198a15623
Revises: 604112efa96c
Create Date: 2025-02-16 11:41:42.109340

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0a6198a15623'
down_revision: Union[str, None] = '604112efa96c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('favorite_articles', sa.Column('feed_id', sa.Integer(), nullable=False))
    op.create_foreign_key(None, 'favorite_articles', 'feeds', ['feed_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'favorite_articles', type_='foreignkey')
    op.drop_column('favorite_articles', 'feed_id')
    # ### end Alembic commands ###
