import type { EvolutionSession, IdeaBrief, IdeaNode } from '@/types/idea';

const SESSIONS_KEY = 'me_sessions';
const NODES_KEY = 'me_nodes';
const BRIEFS_KEY = 'me_briefs';

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function saveSession(session: EvolutionSession): void {
  const all = getAllSessions();
  all[session.id] = session;
  safeSetItem(SESSIONS_KEY, JSON.stringify(all));
}

export function getSession(id: string): EvolutionSession | null {
  const all = getAllSessions();
  return all[id] ?? null;
}

export function getAllSessions(): Record<string, EvolutionSession> {
  const raw = safeGetItem(SESSIONS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, EvolutionSession>;
  } catch {
    return {};
  }
}

export function saveNode(node: IdeaNode): void {
  const all = getAllNodes();
  const list = all[node.sessionId] ?? [];
  const idx = list.findIndex((n) => n.id === node.id);
  if (idx >= 0) {
    list[idx] = node;
  } else {
    list.push(node);
  }
  all[node.sessionId] = list;
  safeSetItem(NODES_KEY, JSON.stringify(all));
}

export function getSessionNodes(sessionId: string): IdeaNode[] {
  const all = getAllNodes();
  return all[sessionId] ?? [];
}

function getAllNodes(): Record<string, IdeaNode[]> {
  const raw = safeGetItem(NODES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, IdeaNode[]>;
  } catch {
    return {};
  }
}

export function saveBrief(brief: IdeaBrief): void {
  const all = getAllBriefs();
  all[brief.sessionId] = brief;
  safeSetItem(BRIEFS_KEY, JSON.stringify(all));
}

export function getBrief(sessionId: string): IdeaBrief | null {
  const all = getAllBriefs();
  return all[sessionId] ?? null;
}

function getAllBriefs(): Record<string, IdeaBrief> {
  const raw = safeGetItem(BRIEFS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, IdeaBrief>;
  } catch {
    return {};
  }
}

export function deleteSession(sessionId: string): void {
  const sessions = getAllSessions();
  delete sessions[sessionId];
  safeSetItem(SESSIONS_KEY, JSON.stringify(sessions));

  const nodes = getAllNodes();
  delete nodes[sessionId];
  safeSetItem(NODES_KEY, JSON.stringify(nodes));

  const briefs = getAllBriefs();
  delete briefs[sessionId];
  safeSetItem(BRIEFS_KEY, JSON.stringify(briefs));
}
