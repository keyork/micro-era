import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ContentType = Literal["video", "article", "podcast", "newsletter"]
SessionStatus = Literal["evolving", "completed", "abandoned"]


class SessionCreate(BaseModel):
    seed_input: str
    content_type: ContentType
    channel_description: str | None = None


class SessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    seed_input: str
    content_type: str
    channel_description: str | None
    current_generation: int
    total_nodes: int
    locked_idea_id: uuid.UUID | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
