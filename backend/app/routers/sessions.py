import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import briefs as crud_briefs
from app.crud import idea_nodes as crud_nodes
from app.crud import sessions as crud_sessions
from app.database import get_db
from app.models.idea_brief import IdeaBrief
from app.models.idea_node import IdeaNode
from app.schemas.idea_brief import IdeaBriefResponse
from app.schemas.idea_node import EvolveRequest, EvolveResponse, IdeaNodeResponse
from app.schemas.session import SessionCreate, SessionResponse

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Temporary: use a fixed demo user UUID until auth is implemented
DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def _node_to_dict(node: IdeaNode) -> dict:
    return {
        "id": node.id,
        "session_id": node.session_id,
        "user_id": node.user_id,
        "title": node.title,
        "description": node.description,
        "tags": node.tags or [],
        "why_promising": node.why_promising,
        "parent_ids": node.parent_ids or [],
        "generation": node.generation,
        "mutation_type": node.mutation_type,
        "status": node.status,
        "score_freshness": node.score_freshness,
        "score_resonance": node.score_resonance,
        "score_feasibility": node.score_feasibility,
        "brightness": node.brightness,
    }


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(body: SessionCreate, db: AsyncSession = Depends(get_db)):
    # Ensure demo user exists
    from app.models.user import User
    from sqlalchemy import select
    user_result = await db.execute(select(User).where(User.id == DEMO_USER_ID))
    if not user_result.scalar_one_or_none():
        db.add(User(id=DEMO_USER_ID, email="demo@microera.app", name="Demo User"))
        await db.commit()

    session = await crud_sessions.create_session(db, DEMO_USER_ID, body)
    return session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    session = await crud_sessions.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/nodes", response_model=list[IdeaNodeResponse])
async def get_session_nodes(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await crud_nodes.get_session_nodes(db, session_id)


@router.post("/{session_id}/evolve", response_model=EvolveResponse)
async def trigger_evolve(session_id: uuid.UUID, body: EvolveRequest, db: AsyncSession = Depends(get_db)):
    """
    Starts evolution. The actual node streaming happens via WebSocket.
    This endpoint just validates the request and returns the new generation number.
    """
    session = await crud_sessions.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return EvolveResponse(generation=session.current_generation + 1)


@router.post("/{session_id}/lock/{node_id}", response_model=IdeaBriefResponse)
async def lock_idea(session_id: uuid.UUID, node_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from app.config import settings
    from anthropic import AsyncAnthropic
    from app.engine.evolution import EvolutionEngine

    session = await crud_sessions.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    node = await crud_nodes.get_node(db, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    all_nodes_orm = await crud_nodes.get_session_nodes(db, session_id)
    all_nodes = [_node_to_dict(n) for n in all_nodes_orm]

    engine = EvolutionEngine(AsyncAnthropic(api_key=settings.anthropic_api_key))
    brief_data = await engine.generate_brief(
        locked_node=_node_to_dict(node),
        session_id=str(session_id),
        all_nodes=all_nodes,
        seed_input=session.seed_input,
        content_type=session.content_type,
        channel_description=session.channel_description,
    )

    brief_orm = IdeaBrief(
        id=brief_data["id"],
        session_id=uuid.UUID(str(session_id)),
        idea_id=node_id,
        core_angle=brief_data["core_angle"],
        target_audience=brief_data["target_audience"],
        outline_points=brief_data["outline_points"],
        evolution_path=[uuid.UUID(str(p)) for p in brief_data["evolution_path"]],
    )
    saved_brief = await crud_briefs.create_brief(db, brief_orm)

    # Update node + session status
    await crud_nodes.update_node_status(db, node_id, "locked")
    await crud_sessions.lock_session(db, session_id, node_id)

    return saved_brief


@router.post("/{session_id}/revive/{node_id}", response_model=IdeaNodeResponse)
async def revive_node(session_id: uuid.UUID, node_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    node = await crud_nodes.update_node_status(db, node_id, "active")
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node
