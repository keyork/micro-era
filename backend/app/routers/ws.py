import asyncio
import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app import store
from app.config import settings
from app.engine.evolution import EvolutionEngine
from app.llm.client import make_client

router = APIRouter(tags=["websocket"])

NODE_DELAY_MS = 700


def _node_to_ws_payload(node: dict) -> dict:
    return {
        "id": str(node["id"]),
        "sessionId": str(node["session_id"]),
        "title": node["title"],
        "description": node.get("description"),
        "tags": node.get("tags", []),
        "whyPromising": node.get("why_promising"),
        "parentIds": [str(p) for p in node.get("parent_ids", [])],
        "generation": node["generation"],
        "mutationType": node["mutation_type"],
        "status": node["status"],
        "scores": {
            "freshness": node.get("score_freshness"),
            "resonance": node.get("score_resonance"),
            "feasibility": node.get("score_feasibility"),
        } if node.get("score_freshness") is not None else None,
        "brightness": node.get("brightness", 1.0),
    }


def _make_engine() -> EvolutionEngine:
    return EvolutionEngine(
        make_client(settings.openai_api_key, settings.llm_base_url),
        settings.llm_model,
    )


@router.websocket("/ws/sessions/{session_id}")
async def ws_evolution(websocket: WebSocket, session_id: uuid.UUID):
    await websocket.accept()

    session = store.get_session(str(session_id))
    if not session:
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    try:
        if session["current_generation"] == 0:
            await _run_big_bang(websocket, session)

        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            if msg.get("type") == "start_evolution":
                selected_ids: list[str] = msg.get("selectedIds", [])
                hybridize: bool = msg.get("hybridize", False)
                await _run_evolve(websocket, session, selected_ids, hybridize)
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
            await websocket.close()
        except Exception:
            pass


async def _run_big_bang(websocket: WebSocket, session: dict):
    engine = _make_engine()
    nodes_data = await engine.big_bang(
        session_id=str(session["id"]),
        user_id=store.DEMO_USER_ID,
        seed_input=session["seed_input"],
        content_type=session["content_type"],
        channel_description=session["channel_description"],
    )
    await _save_and_stream(websocket, session, nodes_data, new_generation=1)


async def _run_evolve(
    websocket: WebSocket,
    session: dict,
    selected_ids: list[str],
    hybridize: bool,
):
    engine = _make_engine()

    for sid in selected_ids:
        if sid in store.nodes:
            store.nodes[sid]["status"] = "selected"

    all_nodes = store.get_session_nodes(str(session["id"]))

    new_nodes_data = await engine.evolve(
        selected_ids=selected_ids,
        all_nodes=all_nodes,
        session_id=str(session["id"]),
        user_id=store.DEMO_USER_ID,
        seed_input=session["seed_input"],
        content_type=session["content_type"],
        channel_description=session["channel_description"],
        current_generation=session["current_generation"],
        hybridize=hybridize,
    )

    next_gen = session["current_generation"] + 1
    await _save_and_stream(websocket, session, new_nodes_data, new_generation=next_gen)


async def _save_and_stream(
    websocket: WebSocket,
    session: dict,
    nodes_data: list[dict],
    new_generation: int,
):
    for i, nd in enumerate(nodes_data):
        saved = store.save_node(nd)
        delay = i * NODE_DELAY_MS
        await websocket.send_json({"type": "node_emerging", "node": _node_to_ws_payload(saved), "delay": delay})
        await asyncio.sleep(NODE_DELAY_MS / 1000)

    session["current_generation"] = new_generation
    session["total_nodes"] += len(nodes_data)
    session["updated_at"] = store.now()

    await websocket.send_json({"type": "evolution_complete", "generation": new_generation})
