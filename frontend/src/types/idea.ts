export type MutationType = 'seed' | 'tweak' | 'crossover' | 'inversion' | 'random' | 'hybrid';
export type NodeStatus = 'active' | 'selected' | 'dormant' | 'locked';
export type SessionStatus = 'evolving' | 'completed' | 'abandoned';
export type ContentType = 'video' | 'article' | 'podcast' | 'newsletter';

export interface IdeaNode {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  tags: string[];
  whyPromising?: string;
  parentIds: string[];
  generation: number;
  mutationType: MutationType;
  status: NodeStatus;
  scores?: {
    freshness: number;
    resonance: number;
    feasibility: number;
  };
  position?: { x: number; y: number };
  brightness: number;
  createdAt: string;
}

export interface EvolutionSession {
  id: string;
  userId: string;
  seedInput: string;
  contentType: ContentType;
  channelDescription?: string;
  currentGeneration: number;
  totalNodes: number;
  lockedIdeaId?: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaBrief {
  id: string;
  sessionId: string;
  ideaId: string;
  coreAngle: string;
  targetAudience: string;
  outlinePoints: string[];
  evolutionPath: string[];
  createdAt: string;
}

// WebSocket event types
export type WSEvent =
  | { type: 'node_emerging'; node: IdeaNode; delay: number }
  | { type: 'evolution_complete'; generation: number }
  | { type: 'brief_generated'; brief: IdeaBrief }
  | { type: 'error'; message: string };
