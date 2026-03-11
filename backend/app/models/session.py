import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EvolutionSession(Base):
    __tablename__ = "evolution_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    seed_input: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(String(50), nullable=False)
    channel_description: Mapped[str | None] = mapped_column(Text)

    current_generation: Mapped[int] = mapped_column(Integer, default=0)
    total_nodes: Mapped[int] = mapped_column(Integer, default=0)
    locked_idea_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("idea_nodes.id", use_alter=True, name="fk_locked_idea"),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(String(20), default="evolving")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="sessions")
    idea_nodes: Mapped[list["IdeaNode"]] = relationship(
        back_populates="session",
        foreign_keys="IdeaNode.session_id",
    )
    locked_idea: Mapped["IdeaNode | None"] = relationship(
        foreign_keys=[locked_idea_id],
        primaryjoin="EvolutionSession.locked_idea_id == IdeaNode.id",
    )
