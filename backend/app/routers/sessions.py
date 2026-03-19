import uuid

from fastapi import APIRouter, HTTPException

from app import store
from app.schemas.idea_brief import IdeaBriefResponse
from app.schemas.idea_node import EvolveRequest, EvolveResponse, IdeaNodeResponse
from app.schemas.session import SessionCreate, SessionResponse

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(body: SessionCreate):
    now = store.now()
    session = {
        "id": uuid.uuid4(),
        "user_id": uuid.UUID(store.DEMO_USER_ID),
        "seed_input": body.seed_input,
        "content_type": body.content_type,
        "channel_description": body.channel_description,
        "current_generation": 0,
        "total_nodes": 0,
        "locked_idea_id": None,
        "status": "evolving",
        "created_at": now,
        "updated_at": now,
    }
    store.sessions[str(session["id"])] = session
    return session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: uuid.UUID):
    session = store.get_session(str(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/nodes", response_model=list[IdeaNodeResponse])
async def get_session_nodes(session_id: uuid.UUID):
    return store.get_session_nodes(str(session_id))


@router.post("/{session_id}/evolve", response_model=EvolveResponse)
async def trigger_evolve(session_id: uuid.UUID, body: EvolveRequest):
    session = store.get_session(str(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return EvolveResponse(generation=session["current_generation"] + 1)


@router.post("/{session_id}/lock/{node_id}", response_model=IdeaBriefResponse)
async def lock_idea(session_id: uuid.UUID, node_id: uuid.UUID):
    from app.config import settings
    from app.engine.evolution import EvolutionEngine
    from app.llm.client import make_client

    session = store.get_session(str(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    node = store.nodes.get(str(node_id))
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    all_nodes = store.get_session_nodes(str(session_id))

    engine = EvolutionEngine(
        make_client(settings.openai_api_key, settings.llm_base_url),
        settings.llm_model,
    )
    brief_data = await engine.generate_brief(
        locked_node=node,
        session_id=str(session_id),
        all_nodes=all_nodes,
        seed_input=session["seed_input"],
        content_type=session["content_type"],
        channel_description=session["channel_description"],
    )

    now = store.now()
    brief = {
        "id": brief_data["id"],
        "session_id": session_id,
        "idea_id": node_id,
        "core_angle": brief_data["core_angle"],
        "target_audience": brief_data["target_audience"],
        "outline_points": brief_data["outline_points"],
        "evolution_path": [uuid.UUID(str(p)) for p in brief_data["evolution_path"]],
        "created_at": now,
    }
    store.briefs[str(session_id)] = brief

    node["status"] = "locked"
    session["locked_idea_id"] = node_id
    session["status"] = "completed"
    session["updated_at"] = now

    return brief


@router.post("/{session_id}/revive/{node_id}", response_model=IdeaNodeResponse)
async def revive_node(session_id: uuid.UUID, node_id: uuid.UUID):
    node = store.nodes.get(str(node_id))
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    node["status"] = "active"
    return node
