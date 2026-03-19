# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**微纪元 (Micro Era)** — AI creative evolution engine for content creators. Users input a seed idea; the system evolves it through mutation, selection, and hybridization rounds, visualised as a 2D galaxy. Full spec in `AGENT.md`.

Licensed under Apache 2.0.

## Collaboration Guidelines

- Push to Git and create a new branch immediately after making significant updates to facilitate collaboration and code review.
- Develop each new feature or bug fix in a dedicated branch and submit a pull request when finished.
- Keep the main branch (main/master) stable and in a deployable state at all times.

---

## Commands

### Frontend (`/frontend`)

```bash
npm run dev        # dev server on :3000
npm run build      # production build
npx tsc --noEmit   # type-check only
```

### Backend (`/backend`)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000   # dev server

# Tests (requires live LLM API key for agent tests)
pytest tests/
pytest tests/test_agents.py -v   # single file
```

---

## Architecture

### Monorepo layout

```
/frontend        Next.js 14 (App Router, TypeScript, Tailwind, React Flow, Framer Motion, Zustand)
/backend         Python FastAPI (in-memory store, OpenAI-compatible SDK)
AGENT.md         Full product + technical spec (source of truth)
```

### Backend structure

```
app/
  main.py            FastAPI app, CORS, router registration
  config.py          Pydantic Settings (reads .env)
  store.py           In-memory store: sessions, nodes, briefs dicts + helpers
  schemas/           Pydantic v2 request/response schemas
  routers/
    sessions.py      REST: POST /api/sessions, GET, POST /evolve, /lock, /revive
    ws.py            WebSocket: /ws/sessions/{sessionId} — streams node_emerging events
    users.py         GET /api/users/me/sessions
  engine/
    evolution.py     EvolutionEngine — orchestrates big_bang() and evolve()
  agents/
    mutation.py      MutationAgent — generates variants (tweak/crossover/inversion/random)
    critic.py        CriticAgent — scores freshness/resonance/feasibility
    hybrid.py        HybridAgent — fuses two parent ideas
    brief.py         BriefAgent — generates final structured Brief
  llm/
    client.py        call_llm() — unified async LLM call with JSON strip + 1 retry
```

LLM client uses OpenAI-compatible Chat Completions API (`llm/client.py` → `make_client` + `call_llm`). Any provider with an OpenAI-compatible endpoint works by setting `LLM_BASE_URL` and `LLM_MODEL` in `.env`. All prompts expect pure JSON output, no markdown fences.

### Frontend structure

```
src/
  app/
    page.tsx                   Landing + SeedInput
    evolve/[sessionId]/page.tsx  Galaxy evolution UI
  components/
    galaxy/                    GalaxyCanvas, IdeaNodeComponent, EdgeComponent, GalaxyLayout
    panels/                    SeedInput, NodeDetail, ControlBar, BriefPanel
    ui/                        ScoreBar, MutationBadge, GlowButton
  stores/evolutionStore.ts     Zustand: nodes as Map<string, IdeaNode> for O(1) lookup
  hooks/
    useWebSocket.ts            Manages WS connection to /ws/sessions/{id}
    useEvolution.ts            Handles WSEvent dispatch + API calls (evolve, lock, revive)
  lib/
    api.ts                     REST client wrapping fetch
    galaxyLayout.ts            Radial layout: seed at (0,0), gen×150px rings
  types/idea.ts                Canonical types (IdeaNode, EvolutionSession, IdeaBrief, WSEvent)
```

### WebSocket flow

1. Frontend connects to `ws://HOST/ws/sessions/{sessionId}`
2. Server auto-triggers `big_bang()` if `current_generation == 0`
3. Nodes stream as `{ type: "node_emerging", node, delay }` — frontend staggers animation by `delay` ms
4. Client sends `{ type: "start_evolution", selectedIds, hybridize }` for subsequent rounds
5. Server replies with `evolution_complete` after all nodes are pushed

### Visual design tokens (CSS vars in `globals.css`)

| Var | Value | Usage |
|-----|-------|-------|
| `--bg-deep` | `#0a0a12` | Canvas / page background |
| `--color-primary` | `#7c6cf0` | Active/selected nodes, tweak mutations |
| `--color-gold` | `#f0c86c` | Seed node, locked state, Brief |
| `--color-pink` | `#f06c8c` | Inversion + random mutations |
| `--color-teal` | `#6cf0c8` | Hybrid nodes |

Node sizes: seed=70px, locked=80px, selected=60px, active=45px, dormant=30px (opacity 0.4).

### Environment variables

**`/backend/.env`**
```
OPENAI_API_KEY=sk-xxx
LLM_BASE_URL=             # leave empty for OpenAI; set for Moonshot, DeepSeek, etc.
LLM_MODEL=gpt-4o-mini     # model name for the chosen provider
```

Provider examples:
- **OpenAI**: `LLM_BASE_URL=` (empty), `LLM_MODEL=gpt-4o`
- **Moonshot**: `LLM_BASE_URL=https://api.moonshot.cn/v1`, `LLM_MODEL=moonshot-v1-8k`
- **DeepSeek**: `LLM_BASE_URL=https://api.deepseek.com/v1`, `LLM_MODEL=deepseek-chat`

**`/frontend/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Key constraints from AGENT.md

- Max 5 evolution rounds per session (~20 nodes) to prevent performance issues
- 20% random mutation probability per round
- JSON parse failure → retry once → fallback (handled in `llm/client.py`)
- No 3D visualisation — React Flow 2D only
- No LangChain — direct OpenAI-compatible SDK calls
- Demo user UUID `00000000-0000-0000-0000-000000000001` used until auth (Phase 7)
