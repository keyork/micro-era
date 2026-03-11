import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.idea_brief import IdeaBrief


async def create_brief(db: AsyncSession, brief: IdeaBrief) -> IdeaBrief:
    db.add(brief)
    await db.commit()
    await db.refresh(brief)
    return brief


async def get_brief_by_session(db: AsyncSession, session_id: uuid.UUID) -> IdeaBrief | None:
    result = await db.execute(
        select(IdeaBrief).where(IdeaBrief.session_id == session_id).order_by(IdeaBrief.created_at.desc())
    )
    return result.scalar_one_or_none()
