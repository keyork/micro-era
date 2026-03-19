# micro-era

Stop brainstorming. Start evolving

# 1. Backend

  cd backend
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env   # then fill in OPENAI_API_KEY (and optionally LLM_BASE_URL, LLM_MODEL)
  uvicorn app.main:app --reload --port 8000

# 2. Frontend (new terminal)

  cd frontend && npm run dev

  Then open <http://localhost:3000>.

---

**No database or Redis required** — the backend uses an in-memory store.

## Environment variables

`/backend/.env`:
```
OPENAI_API_KEY=sk-xxx
LLM_BASE_URL=             # leave empty for OpenAI; set for Moonshot, DeepSeek, etc.
LLM_MODEL=gpt-4o-mini
```

`/frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```
