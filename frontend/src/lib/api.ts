import { ContentType, EvolutionSession, IdeaBrief, IdeaNode } from '@/types/idea';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

type ApiIdeaNode = {
  id: string;
  session_id?: string;
  sessionId?: string;
  title: string;
  description?: string | null;
  tags?: string[];
  why_promising?: string | null;
  whyPromising?: string | null;
  parent_ids?: string[];
  parentIds?: string[];
  generation: number;
  mutation_type?: IdeaNode['mutationType'];
  mutationType?: IdeaNode['mutationType'];
  status: IdeaNode['status'];
  score_freshness?: number | null;
  score_resonance?: number | null;
  score_feasibility?: number | null;
  scores?: IdeaNode['scores'];
  position_x?: number | null;
  position_y?: number | null;
  brightness?: number;
  created_at?: string;
  createdAt?: string;
};

type ApiSession = {
  id: string;
  user_id?: string;
  userId?: string;
  seed_input?: string;
  seedInput?: string;
  content_type?: ContentType;
  contentType?: ContentType;
  channel_description?: string | null;
  channelDescription?: string | null;
  current_generation?: number;
  currentGeneration?: number;
  total_nodes?: number;
  totalNodes?: number;
  locked_idea_id?: string | null;
  lockedIdeaId?: string | null;
  status: EvolutionSession['status'];
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type ApiBrief = {
  id: string;
  session_id?: string;
  sessionId?: string;
  idea_id?: string;
  ideaId?: string;
  core_angle?: string;
  coreAngle?: string;
  target_audience?: string;
  targetAudience?: string;
  outline_points?: string[];
  outlinePoints?: string[];
  evolution_path?: string[];
  evolutionPath?: string[];
  created_at?: string;
  createdAt?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

function normalizeIdeaNode(node: ApiIdeaNode): IdeaNode {
  const scores = node.scores ?? (
    node.score_freshness != null && node.score_resonance != null && node.score_feasibility != null
      ? {
          freshness: node.score_freshness,
          resonance: node.score_resonance,
          feasibility: node.score_feasibility,
        }
      : undefined
  );

  const position =
    node.position_x != null && node.position_y != null
      ? { x: node.position_x, y: node.position_y }
      : undefined;

  return {
    id: String(node.id),
    sessionId: String(node.sessionId ?? node.session_id ?? ''),
    title: node.title,
    description: node.description ?? undefined,
    tags: node.tags ?? [],
    whyPromising: node.whyPromising ?? node.why_promising ?? undefined,
    parentIds: (node.parentIds ?? node.parent_ids ?? []).map(String),
    generation: node.generation,
    mutationType: (node.mutationType ?? node.mutation_type ?? 'tweak') as IdeaNode['mutationType'],
    status: node.status,
    scores,
    position,
    brightness: node.brightness ?? 1,
    createdAt: node.createdAt ?? node.created_at ?? new Date(0).toISOString(),
  };
}

function normalizeSession(session: ApiSession): EvolutionSession {
  return {
    id: String(session.id),
    userId: String(session.userId ?? session.user_id ?? ''),
    seedInput: String(session.seedInput ?? session.seed_input ?? ''),
    contentType: (session.contentType ?? session.content_type ?? 'video') as ContentType,
    channelDescription: session.channelDescription ?? session.channel_description ?? undefined,
    currentGeneration: session.currentGeneration ?? session.current_generation ?? 0,
    totalNodes: session.totalNodes ?? session.total_nodes ?? 0,
    lockedIdeaId: session.lockedIdeaId ?? session.locked_idea_id ?? undefined,
    status: session.status,
    createdAt: session.createdAt ?? session.created_at ?? new Date(0).toISOString(),
    updatedAt: session.updatedAt ?? session.updated_at ?? new Date(0).toISOString(),
  };
}

function normalizeBrief(brief: ApiBrief): IdeaBrief {
  return {
    id: String(brief.id),
    sessionId: String(brief.sessionId ?? brief.session_id ?? ''),
    ideaId: String(brief.ideaId ?? brief.idea_id ?? ''),
    coreAngle: String(brief.coreAngle ?? brief.core_angle ?? ''),
    targetAudience: String(brief.targetAudience ?? brief.target_audience ?? ''),
    outlinePoints: brief.outlinePoints ?? brief.outline_points ?? [],
    evolutionPath: (brief.evolutionPath ?? brief.evolution_path ?? []).map(String),
    createdAt: brief.createdAt ?? brief.created_at ?? new Date(0).toISOString(),
  };
}

export const api = {
  createSession: (body: {
    seedInput: string;
    contentType: ContentType;
    channelDescription?: string;
  }) =>
    request<ApiSession>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        seed_input: body.seedInput,
        content_type: body.contentType,
        channel_description: body.channelDescription,
      }),
    }).then(normalizeSession),

  getSession: (id: string) => request<ApiSession>(`/api/sessions/${id}`).then(normalizeSession),

  getSessionNodes: (id: string) =>
    request<ApiIdeaNode[]>(`/api/sessions/${id}/nodes`).then((nodes) => nodes.map(normalizeIdeaNode)),

  evolve: (id: string, body: { selectedIds: string[]; hybridize?: boolean }) =>
    request<{ generation: number }>(`/api/sessions/${id}/evolve`, {
      method: 'POST',
      body: JSON.stringify({ selected_ids: body.selectedIds, hybridize: body.hybridize ?? false }),
    }),

  lockIdea: (sessionId: string, nodeId: string) =>
    request<ApiBrief>(`/api/sessions/${sessionId}/lock/${nodeId}`, { method: 'POST' }).then(normalizeBrief),

  reviveNode: (sessionId: string, nodeId: string) =>
    request<ApiIdeaNode>(`/api/sessions/${sessionId}/revive/${nodeId}`, { method: 'POST' }).then(normalizeIdeaNode),

  getUserSessions: () =>
    request<ApiSession[]>('/api/users/me/sessions').then((sessions) => sessions.map(normalizeSession)),
};
