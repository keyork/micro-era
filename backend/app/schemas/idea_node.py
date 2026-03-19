import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

MutationType = Literal["seed", "tweak", "crossover", "inversion", "random", "hybrid"]
NodeStatus = Literal["active", "selected", "dormant", "locked"]


class Scores(BaseModel):
    freshness: int
    resonance: int
    feasibility: int


class IdeaNodeResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: str | None
    tags: list[str]
    why_promising: str | None
    parent_ids: list[uuid.UUID]
    generation: int
    mutation_type: str
    status: str
    score_freshness: int | None
    score_resonance: int | None
    score_feasibility: int | None
    position_x: float | None
    position_y: float | None
    brightness: float
    created_at: datetime

    model_config = {"from_attributes": True}


class EvolveRequest(BaseModel):
    selected_ids: list[uuid.UUID]
    hybridize: bool = False


class EvolveResponse(BaseModel):
    generation: int
