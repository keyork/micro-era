import asyncio
import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.crud import idea_nodes as crud_nodes
from app.crud import sessions as crud_sessions
from app.database import AsyncSessionLocal
from app.engine.evolution import EvolutionEngine
from app.models.idea_node import IdeaNode
from app.routers.sessions import DEMO_USER_ID

router = APIRouter(tags=["websocket"])

NODE_DELAY_MS = 700  # ms between each node emerging


def _node_dict_to_ws_payload(node_dict: dict) -> dict:
    """Convert raw node dict to JSON-serializable WebSocket payload."""
    return {
        "id": str(node_dict["id"]),
        "sessionId": str(node_dict["session_id"]),
        "title": node_dict["title"],
        "description": node_dict.get("description"),
        "tags": node_dict.get("tags", []),
        "whyPromising": node_dict.get("why_promising"),
        "parentIds": [str(p) for p in node_dict.get("parent_ids", [])],
        "generation": node_dict["generation"],
        "mutationType": node_dict["mutation_type"],
        "status": node_dict["status"],
        "scores": {
            "freshness": node_dict.get("score_freshness"),
            "resonance": node_dict.get("score_resonance"),
            "feasibility": node_dict.get("score_feasibility"),
        } if node_dict.get("score_freshness") is not None else None,
        "brightness": node_dict.get("brightness", 1.0),
    }


def _orm_to_dict(node: IdeaNode) -> dict:
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


@router.websocket("/ws/sessions/{session_id}")
async def ws_evolution(websocket: WebSocket, session_id: uuid.UUID):
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        session = await crud_sessions.get_session(db, session_id)
        if not session:
            await websocket.send_json({"type": "error", "message": "Session not found"})
            await websocket.close()
            return

        # On connect, trigger big_bang if generation == 0
        if session.current_generation == 0:
            await _run_big_bang(websocket, db, session, session_id)

        # Listen for evolution commands
        try:
            while True:
                raw = await websocket.receive_text()
                msg = json.loads(raw)

                if msg.get("type") == "start_evolution":
                    selected_ids: list[str] = msg.get("selectedIds", [])
                    hybridize: bool = msg.get("hybridize", False)
                    await _run_evolve(websocket, db, session, session_id, selected_ids, hybridize)

        except WebSocketDisconnect:
            pass


async def _run_big_bang(websocket: WebSocket, db: AsyncSession, session, session_id: uuid.UUID):
    from anthropic import AsyncAnthropic
    engine = EvolutionEngine(AsyncAnthropic(api_key=settings.anthropic_api_key))

    nodes_data = await engine.big_bang(
        session_id=str(session_id),
        user_id=str(DEMO_USER_ID),
        seed_input=session.seed_input,
        content_type=session.content_type,
        channel_description=session.channel_description,
    )

    saved = await _save_and_stream(websocket, db, session, nodes_data, session_id, new_generation=1)
    return saved


async def _run_evolve(
    websocket: WebSocket,
    db: AsyncSession,
    session,
    session_id: uuid.UUID,
    selected_ids: list[str],
    hybridize: bool,
):
    from anthropic import AsyncAnthropic
    engine = EvolutionEngine(AsyncAnthropic(api_key=settings.anthropic_api_key))

    # Mark selected nodes
    for sid in selected_ids:
        try:
            await crud_nodes.update_node_status(db, uuid.UUID(sid), "selected")
        except Exception:
            pass

    all_orm = await crud_nodes.get_session_nodes(db, session_id)
    all_nodes = [_orm_to_dict(n) for n in all_orm]

    new_nodes_data = await engine.evolve(
        selected_ids=selected_ids,
        all_nodes=all_nodes,
        session_id=str(session_id),
        user_id=str(DEMO_USER_ID),
        seed_input=session.seed_input,
        content_type=session.content_type,
        channel_description=session.channel_description,
        current_generation=session.current_generation,
        hybridize=hybridize,
    )

    next_gen = session.current_generation + 1
    await _save_and_stream(websocket, db, session, new_nodes_data, session_id, new_generation=next_gen)


async def _save_and_stream(
    websocket: WebSocket,
    db: AsyncSession,
    session,
    nodes_data: list[dict],
    session_id: uuid.UUID,
    new_generation: int,
) -> list[IdeaNode]:
    saved: list[IdeaNode] = []
    for i, nd in enumerate(nodes_data):
        orm_node = IdeaNode(
            id=nd["id"],
            session_id=uuid.UUID(str(nd["session_id"])),
            user_id=uuid.UUID(str(nd["user_id"])),
            title=nd["title"],
            description=nd.get("description"),
            tags=nd.get("tags", []),
            why_promising=nd.get("why_promising"),
            parent_ids=[uuid.UUID(str(p)) for p in nd.get("parent_ids", [])],
            generation=nd["generation"],
            mutation_type=nd["mutation_type"],
            status=nd["status"],
            score_freshness=nd.get("score_freshness"),
            score_resonance=nd.get("score_resonance"),
            score_feasibility=nd.get("score_feasibility"),
            brightness=nd.get("brightness", 1.0),
        )
        db.add(orm_node)
        await db.flush()
        saved.append(orm_node)

        delay = i * NODE_DELAY_MS
        payload = _node_dict_to_ws_payload(nd)
        await websocket.send_json({"type": "node_emerging", "node": payload, "delay": delay})
        await asyncio.sleep(NODE_DELAY_MS / 1000)

    # Update session generation counter
    session.current_generation = new_generation
    session.total_nodes += len(nodes_data)
    await db.commit()

    await websocket.send_json({"type": "evolution_complete", "generation": new_generation})
    return saved
