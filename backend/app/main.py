from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import sessions, users, ws

app = FastAPI(title="Micro Era API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(users.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
