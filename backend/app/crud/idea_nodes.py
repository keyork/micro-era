import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.idea_node import IdeaNode


async def create_node(db: AsyncSession, node: IdeaNode) -> IdeaNode:
    db.add(node)
    await db.commit()
    await db.refresh(node)
    return node


async def create_nodes(db: AsyncSession, nodes: list[IdeaNode]) -> list[IdeaNode]:
    for node in nodes:
        db.add(node)
    await db.commit()
    for node in nodes:
        await db.refresh(node)
    return nodes


async def get_node(db: AsyncSession, node_id: uuid.UUID) -> IdeaNode | None:
    result = await db.execute(select(IdeaNode).where(IdeaNode.id == node_id))
    return result.scalar_one_or_none()


async def get_nodes_by_ids(db: AsyncSession, node_ids: list[uuid.UUID]) -> list[IdeaNode]:
    result = await db.execute(select(IdeaNode).where(IdeaNode.id.in_(node_ids)))
    return list(result.scalars().all())


async def get_session_nodes(db: AsyncSession, session_id: uuid.UUID) -> list[IdeaNode]:
    result = await db.execute(
        select(IdeaNode).where(IdeaNode.session_id == session_id).order_by(IdeaNode.created_at)
    )
    return list(result.scalars().all())


async def update_node_status(db: AsyncSession, node_id: uuid.UUID, status: str) -> IdeaNode | None:
    node = await get_node(db, node_id)
    if node:
        node.status = status
        await db.commit()
        await db.refresh(node)
    return node


async def increment_session_node_count(db: AsyncSession, session_id: uuid.UUID) -> None:
    from app.crud.sessions import get_session
    session = await get_session(db, session_id)
    if session:
        session.total_nodes += 1
        await db.commit()
