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

```bash
npm run dev        # dev server on :3000
npm run build      # production build
npx tsc --noEmit   # type-check only
```

---

## Architecture

### Pure frontend — no backend

This is a **pure frontend application**. All logic runs in the browser:
- LLM calls go directly from browser to OpenAI-compatible APIs using `fetch`
- Sessions, nodes, and briefs are persisted in `localStorage`
- No server, no WebSocket, no database required

### Project structure

```
src/
  app/
    page.tsx                   Landing + SeedInput + SettingsPanel
    evolve/[sessionId]/page.tsx  Galaxy evolution UI
  components/
    galaxy/                    GalaxyCanvas, IdeaNodeComponent, EdgeComponent, GalaxyLayout
    panels/                    SeedInput, NodeDetail, ControlBar, BriefPanel, SettingsPanel
    ui/                        ScoreBar, MutationBadge, GlowButton
  stores/evolutionStore.ts     Zustand: nodes as Map<string, IdeaNode> for O(1) lookup
  hooks/
    useEvolution.ts            Orchestrates big_bang, evolve, lock, revive via EvolutionEngine
    useLLMConfig.ts            Manages API key / base URL / model in localStorage
  lib/
    api.ts                     Local store facade (create/get sessions, nodes, etc.)
    galaxyLayout.ts            Radial layout: seed at (0,0), gen×150px rings
    llm/client.ts              fetch-based OpenAI-compatible Chat Completions client
    agents/
      mutation.ts              MutationAgent — generates variants (tweak/crossover/inversion/random)
      critic.ts                CriticAgent — scores freshness/resonance/feasibility
      hybrid.ts                HybridAgent — fuses two parent ideas
      brief.ts                 BriefAgent — generates final structured Brief
    engine/
      evolution.ts             EvolutionEngine — orchestrates big_bang() and evolve()
    store/
      localStore.ts            localStorage persistence for sessions, nodes, briefs
  types/idea.ts                Canonical types (IdeaNode, EvolutionSession, IdeaBrief)
```

### LLM configuration

Users configure their API key through the SettingsPanel on the home page. The config is stored in `localStorage` under key `llm_config`:

```typescript
{ apiKey: string; baseUrl: string; model: string }
```

Any OpenAI-compatible provider works:
- **OpenAI**: leave baseUrl empty, model = `gpt-4o`
- **Moonshot**: baseUrl = `https://api.moonshot.cn/v1`, model = `moonshot-v1-8k`
- **DeepSeek**: baseUrl = `https://api.deepseek.com/v1`, model = `deepseek-chat`

### Evolution flow

1. User enters seed idea → session created in localStorage
2. Navigate to evolve page → GalaxyCanvas bootstraps from localStorage
3. If first generation: `useEvolution.runBigBang()` creates engine, calls LLM, streams nodes with 700ms delays
4. User selects nodes → `useEvolution.runEvolve()` calls engine.evolve()
5. User locks → `useEvolution.lockIdea()` calls engine.generateBrief()
6. All data persisted to localStorage via `lib/store/localStore.ts`

### Visual design tokens (CSS vars in `globals.css`)

| Var | Value | Usage |
|-----|-------|-------|
| `--bg-deep` | `#0a0a12` | Canvas / page background |
| `--color-primary` | `#7c6cf0` | Active/selected nodes, tweak mutations |
| `--color-gold` | `#f0c86c` | Seed node, locked state, Brief |
| `--color-pink` | `#f06c8c` | Inversion + random mutations |
| `--color-teal` | `#6cf0c8` | Hybrid nodes |

Node sizes: seed=70px, locked=80px, selected=60px, active=45px, dormant=30px (opacity 0.4).

### Key constraints from AGENT.md

- Max 5 evolution rounds per session (~20 nodes) to prevent performance issues
- 20% random mutation probability per round
- JSON parse failure → retry once → error (handled in `lib/llm/client.ts`)
- No 3D visualisation — React Flow 2D only
- No LangChain — direct OpenAI-compatible API calls via fetch
