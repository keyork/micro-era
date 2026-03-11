import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import EvolutionSession
from app.schemas.session import SessionCreate


async def create_session(db: AsyncSession, user_id: uuid.UUID, data: SessionCreate) -> EvolutionSession:
    session = EvolutionSession(
        user_id=user_id,
        seed_input=data.seed_input,
        content_type=data.content_type,
        channel_description=data.channel_description,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(db: AsyncSession, session_id: uuid.UUID) -> EvolutionSession | None:
    result = await db.execute(select(EvolutionSession).where(EvolutionSession.id == session_id))
    return result.scalar_one_or_none()


async def get_user_sessions(db: AsyncSession, user_id: uuid.UUID) -> list[EvolutionSession]:
    result = await db.execute(
        select(EvolutionSession).where(EvolutionSession.user_id == user_id).order_by(EvolutionSession.created_at.desc())
    )
    return list(result.scalars().all())


async def update_session_generation(db: AsyncSession, session_id: uuid.UUID, generation: int) -> None:
    session = await get_session(db, session_id)
    if session:
        session.current_generation = generation
        await db.commit()


async def lock_session(db: AsyncSession, session_id: uuid.UUID, idea_id: uuid.UUID) -> EvolutionSession | None:
    session = await get_session(db, session_id)
    if session:
        session.locked_idea_id = idea_id
        session.status = "completed"
        await db.commit()
        await db.refresh(session)
    return session
