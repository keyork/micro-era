import { ContentType, EvolutionSession, IdeaBrief, IdeaNode } from '@/types/idea';
import * as localStore from '@/lib/store/localStore';

function newId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export const api = {
  createSession: (body: {
    seedInput: string;
    contentType: ContentType;
    channelDescription?: string;
  }): EvolutionSession => {
    const session: EvolutionSession = {
      id: newId(),
      userId: 'local-user',
      seedInput: body.seedInput,
      contentType: body.contentType,
      channelDescription: body.channelDescription,
      currentGeneration: 0,
      totalNodes: 0,
      status: 'evolving',
      createdAt: now(),
      updatedAt: now(),
    };
    localStore.saveSession(session);
    return session;
  },

  getSession: (id: string): EvolutionSession | null => {
    return localStore.getSession(id);
  },

  getSessionNodes: (id: string): IdeaNode[] => {
    return localStore.getSessionNodes(id);
  },

  evolve: (_id: string, _body: { selectedIds: string[]; hybridize?: boolean }): { generation: number } => {
    throw new Error('Use useEvolution.runEvolve() instead of api.evolve()');
  },

  lockIdea: (_sessionId: string, _nodeId: string): IdeaBrief => {
    throw new Error('Use useEvolution.lockIdea() instead of api.lockIdea()');
  },

  reviveNode: (sessionId: string, nodeId: string): IdeaNode => {
    const nodes = localStore.getSessionNodes(sessionId);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) throw new Error('Node not found');
    node.status = 'active';
    localStore.saveNode(node);
    return node;
  },

  getUserSessions: (): EvolutionSession[] => {
    const all = localStore.getAllSessions();
    return Object.values(all).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
};
