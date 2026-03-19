"""In-memory data store — replaces PostgreSQL + Redis for lightweight operation."""
import uuid
from datetime import datetime, timezone

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

sessions: dict[str, dict] = {}  # session_id (str) -> session dict
nodes: dict[str, dict] = {}     # node_id (str) -> node dict
briefs: dict[str, dict] = {}    # session_id (str) -> brief dict


def now() -> datetime:
    return datetime.now(timezone.utc)


def get_session(session_id: str) -> dict | None:
    return sessions.get(session_id)


def get_session_nodes(session_id: str) -> list[dict]:
    return [n for n in nodes.values() if str(n["session_id"]) == session_id]


def save_node(nd: dict) -> dict:
    """Normalise and persist a node dict from the evolution engine."""
    node = {
        **nd,
        "id": uuid.UUID(str(nd["id"])),
        "session_id": uuid.UUID(str(nd["session_id"])),
        "user_id": uuid.UUID(str(nd["user_id"])),
        "parent_ids": [uuid.UUID(str(p)) for p in nd.get("parent_ids", [])],
        "position_x": None,
        "position_y": None,
        "created_at": now(),
    }
    nodes[str(node["id"])] = node
    return node
