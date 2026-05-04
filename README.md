# Micro Era

Micro Era is a browser-only idea evolution workspace for content creators.

Instead of asking an LLM for one finished idea, Micro Era treats a rough topic as a seed. It expands that seed into candidate directions, scores them, lets you select and combine branches, and eventually locks one direction into a structured content brief.

The current app is an MVP focused on the end-to-end workflow:

1. Connect an OpenAI-compatible LLM.
2. Enter a seed idea.
3. Explore the generated idea galaxy.
4. Evolve, hybridize, revive, and lock a final direction.
5. Export the final brief as Markdown.

## Features

- Pure frontend app: no custom backend required.
- Browser-side LLM calls through an OpenAI-compatible Chat Completions API.
- Local persistence for sessions, idea nodes, and briefs using `localStorage`.
- Guided home flow: connect model first, then write the seed idea.
- First-generation idea expansion from a seed topic.
- Critic scoring for freshness, resonance, and feasibility.
- Interactive React Flow canvas for selecting, reviving, evolving, and hybridizing nodes.
- Final brief generation with core angle, target audience, outline, and evolution path.
- Markdown export for the locked brief.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- React Flow
- Framer Motion
- Zustand

## Requirements

- Node.js 20+
- npm 10+
- An OpenAI-compatible API key

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

`npm run dev` intentionally uses webpack:

```json
"dev": "next dev . --webpack"
```

This avoids a Turbopack dev CSS resolver issue where Tailwind can be resolved from the parent workspace directory instead of this project directory. Production builds still use the default Next.js build pipeline.

## LLM Configuration

Micro Era calls the LLM directly from the browser. Your API key is stored only in your browser localStorage.

On the home screen:

1. Go to the model configuration step.
2. Enter an API key.
3. Optionally enter a Base URL and model name.
4. Use the connection test before creating a session.

Example providers:

| Provider | Base URL | Model example |
| --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` or leave blank | `gpt-4o-mini` |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| Moonshot | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |

The provider must support a browser-accessible OpenAI-compatible `/chat/completions` endpoint. Some providers may block browser calls with CORS rules.

## Usage Flow

### 1. Connect the model

The app starts by asking for LLM configuration. This prevents creating a seed session that cannot run the first generation.

### 2. Write a seed idea

Enter a rough topic, choose the target format, and optionally describe your channel or audience. The seed does not need to be polished; it should contain the tension or observation you want to explore.

### 3. Generate the first galaxy

After submitting the seed, the canvas opens and runs the first expansion:

- Creates the seed node.
- Generates first-generation variants.
- Scores those variants.
- Places the nodes on the galaxy canvas.

### 4. Explore and evolve

On the canvas:

- Click an active node to select or deselect it.
- Select one node and choose evolve to generate another generation.
- Select two nodes and choose hybridize to combine directions.
- Double-click a dormant node to revive it.
- Lock one selected node to generate the final brief.

### 5. Export the brief

After locking an idea, Micro Era generates a brief and lets you export it as Markdown. The export includes:

- Core angle
- Target audience
- Outline points
- Evolution path

## Evolution Model

Micro Era uses four mutation strategies in the first generation:

- `tweak`: keep the core angle and adjust the framing.
- `crossover`: bring in a different domain or lens.
- `inversion`: test the opposite premise.
- `random`: make a larger jump while preserving abstract relevance.

Later rounds can also use:

- `hybrid`: combine two selected parent nodes.

The critic agent scores candidates on:

- Freshness
- Resonance
- Feasibility

If the LLM returns malformed JSON, the client attempts repair. If repair still fails, the app falls back to structured placeholder output where possible instead of leaving the UI blank.

## Project Structure

```text
src/
  app/
    page.tsx
    evolve/[sessionId]/page.tsx
    globals.css
  components/
    home/                 # guided home flow
    galaxy/               # React Flow canvas, nodes, edges, layout visuals
    panels/               # seed input, settings, controls, details, brief panel
    ui/
  hooks/
    useEvolution.ts       # client-side evolution workflow
    useLLMConfig.ts       # local LLM settings
  lib/
    agents/               # mutation, critic, hybrid, brief agents
    engine/evolution.ts   # EvolutionEngine orchestration
    llm/client.ts         # OpenAI-compatible fetch client
    store/localStore.ts   # localStorage persistence
    api.ts
  stores/
    evolutionStore.ts
  types/
    idea.ts
```

## Scripts

```bash
npm run dev      # Start local dev server with webpack
npm run build    # Production build
npm run start    # Serve the built app
```

## Data and Privacy

Micro Era has no custom backend in this repo.

- API key: stored in browser `localStorage`.
- Sessions: stored in browser `localStorage`.
- Nodes and briefs: stored in browser `localStorage`.
- LLM prompts and responses: sent directly between the browser and the configured provider.

Do not use sensitive API keys on a shared or untrusted browser profile.

## Known Constraints

- Browser-side LLM calls depend on provider CORS support.
- `localStorage` is convenient for the MVP but not suitable for multi-device sync.
- Long or repeated sessions can increase localStorage size.
- The canvas is optimized for moderate node counts, not thousands of nodes.
- Development mode uses webpack because Turbopack dev currently resolves Tailwind incorrectly in this workspace layout.

## Troubleshooting

### Tailwind resolution error in dev

If you see an error like:

```text
Can't resolve 'tailwindcss' in '/Users/.../work/ky'
```

make sure you are running:

```bash
npm run dev
```

and that the script still includes `--webpack`.

### LLM connection fails

Check:

- API key is present.
- Base URL has no trailing path mistakes.
- Model name is supported by the provider.
- Provider allows browser requests.
- Network or CORS errors in the browser console.

### Canvas opens but no nodes appear

Check:

- API key is configured.
- First-generation LLM request succeeded.
- localStorage is not full or blocked by the browser.

If a session is corrupted, return home and create a new session.

## License

See [LICENSE](./LICENSE).
