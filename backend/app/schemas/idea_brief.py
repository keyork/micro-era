import uuid
from datetime import datetime

from pydantic import BaseModel


class IdeaBriefResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    idea_id: uuid.UUID
    core_angle: str
    target_audience: str
    outline_points: list[str]
    evolution_path: list[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}
