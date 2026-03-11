from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import sessions as crud_sessions
from app.database import get_db
from app.routers.sessions import DEMO_USER_ID
from app.schemas.session import SessionResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me/sessions", response_model=list[SessionResponse])
async def get_my_sessions(db: AsyncSession = Depends(get_db)):
    return await crud_sessions.get_user_sessions(db, DEMO_USER_ID)
