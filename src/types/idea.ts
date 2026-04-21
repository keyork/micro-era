export type MutationType = 'seed' | 'tweak' | 'crossover' | 'inversion' | 'random' | 'hybrid';
export type NodeStatus = 'active' | 'selected' | 'dormant' | 'locked';
export type SessionStatus = 'evolving' | 'completed' | 'abandoned';
export type ContentType = 'video' | 'article' | 'podcast' | 'newsletter';
export type PendingAction = 'big_bang' | 'evolve' | 'hybridize' | 'lock' | 'revive' | null;
export type ActivityTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error';

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

export interface ActivityMessage {
  id: string;
  title: string;
  detail: string;
  tone: ActivityTone;
  timestamp: number;
}


