import { ContentType, EvolutionSession, IdeaBrief, IdeaNode } from '@/types/idea';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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

export const api = {
  createSession: (body: {
    seedInput: string;
    contentType: ContentType;
    channelDescription?: string;
  }) =>
    request<EvolutionSession>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        seed_input: body.seedInput,
        content_type: body.contentType,
        channel_description: body.channelDescription,
      }),
    }),

  getSession: (id: string) => request<EvolutionSession>(`/api/sessions/${id}`),

  getSessionNodes: (id: string) => request<IdeaNode[]>(`/api/sessions/${id}/nodes`),

  evolve: (id: string, body: { selectedIds: string[]; hybridize?: boolean }) =>
    request<{ generation: number }>(`/api/sessions/${id}/evolve`, {
      method: 'POST',
      body: JSON.stringify({ selected_ids: body.selectedIds, hybridize: body.hybridize ?? false }),
    }),

  lockIdea: (sessionId: string, nodeId: string) =>
    request<IdeaBrief>(`/api/sessions/${sessionId}/lock/${nodeId}`, { method: 'POST' }),

  reviveNode: (sessionId: string, nodeId: string) =>
    request<IdeaNode>(`/api/sessions/${sessionId}/revive/${nodeId}`, { method: 'POST' }),

  getUserSessions: () => request<EvolutionSession[]>('/api/users/me/sessions'),
};
