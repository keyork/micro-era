"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-11

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(255)),
        sa.Column("avatar_url", sa.Text),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "evolution_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("seed_input", sa.Text, nullable=False),
        sa.Column("content_type", sa.String(50), nullable=False),
        sa.Column("channel_description", sa.Text),
        sa.Column("current_generation", sa.Integer, server_default="0"),
        sa.Column("total_nodes", sa.Integer, server_default="0"),
        sa.Column("locked_idea_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(20), server_default="evolving"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "idea_nodes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("evolution_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("tags", postgresql.ARRAY(sa.Text), server_default="{}"),
        sa.Column("why_promising", sa.Text),
        sa.Column("parent_ids", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), server_default="{}"),
        sa.Column("generation", sa.Integer, nullable=False, server_default="0"),
        sa.Column("mutation_type", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("score_freshness", sa.Integer),
        sa.Column("score_resonance", sa.Integer),
        sa.Column("score_feasibility", sa.Integer),
        sa.Column("position_x", sa.Float),
        sa.Column("position_y", sa.Float),
        sa.Column("brightness", sa.Float, server_default="1.0"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "idea_briefs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("evolution_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("idea_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("idea_nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("core_angle", sa.Text, nullable=False),
        sa.Column("target_audience", sa.Text, nullable=False),
        sa.Column("outline_points", postgresql.ARRAY(sa.Text), nullable=False),
        sa.Column("evolution_path", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )

    # Deferred FK: evolution_sessions.locked_idea_id → idea_nodes.id
    op.create_foreign_key(
        "fk_locked_idea",
        "evolution_sessions",
        "idea_nodes",
        ["locked_idea_id"],
        ["id"],
    )

    # Indexes
    op.create_index("idx_idea_nodes_session", "idea_nodes", ["session_id"])
    op.create_index("idx_idea_nodes_status", "idea_nodes", ["session_id", "status"])
    op.create_index("idx_sessions_user", "evolution_sessions", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_sessions_user", table_name="evolution_sessions")
    op.drop_index("idx_idea_nodes_status", table_name="idea_nodes")
    op.drop_index("idx_idea_nodes_session", table_name="idea_nodes")
    op.drop_constraint("fk_locked_idea", "evolution_sessions", type_="foreignkey")
    op.drop_table("idea_briefs")
    op.drop_table("idea_nodes")
    op.drop_table("evolution_sessions")
    op.drop_table("users")
