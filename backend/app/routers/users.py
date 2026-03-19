from fastapi import APIRouter

from app import store
from app.schemas.session import SessionResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me/sessions", response_model=list[SessionResponse])
async def get_my_sessions():
    uid = store.DEMO_USER_ID
    return [s for s in store.sessions.values() if str(s["user_id"]) == uid]
