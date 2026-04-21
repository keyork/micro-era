import { create } from 'zustand';
import {
  ActivityMessage,
  IdeaBrief,
  IdeaNode,
  NodeStatus,
  EvolutionSession,
  PendingAction,
} from '@/types/idea';

interface EvolutionStore {
  session: EvolutionSession | null;
  nodes: Map<string, IdeaNode>;
  selectedNodeIds: string[];
  focusedNodeId: string | null;
  isEvolving: boolean;
  brief: IdeaBrief | null;
  pendingAction: PendingAction;
  activity: ActivityMessage | null;
  activityLog: ActivityMessage[];
  errorMessage: string | null;

  setSession: (session: EvolutionSession) => void;
  updateSession: (patch: Partial<EvolutionSession>) => void;
  setNodes: (nodes: IdeaNode[]) => void;
  addNode: (node: IdeaNode) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
  selectNode: (nodeId: string) => void;
  deselectNode: (nodeId: string) => void;
  focusNode: (nodeId: string | null) => void;
  setEvolving: (v: boolean) => void;
  setPendingAction: (action: PendingAction) => void;
  setActivity: (activity: Omit<ActivityMessage, 'id' | 'timestamp'> | null) => void;
  setErrorMessage: (message: string | null) => void;
  setBrief: (brief: IdeaBrief) => void;
  clearSelection: () => void;
  reset: () => void;
}

const initialState = {
  session: null,
  nodes: new Map<string, IdeaNode>(),
  selectedNodeIds: [] as string[],
  focusedNodeId: null,
  isEvolving: false,
  brief: null,
  pendingAction: null as PendingAction,
  activity: null as ActivityMessage | null,
  activityLog: [] as ActivityMessage[],
  errorMessage: null as string | null,
};

export const useEvolutionStore = create<EvolutionStore>((set) => ({
  ...initialState,

  setSession: (session) => set({ session }),

  updateSession: (patch) =>
    set((state) => ({
      session: state.session ? { ...state.session, ...patch } : null,
    })),

  setNodes: (nodes) =>
    set({
      nodes: new Map(nodes.map((node) => [node.id, node])),
    }),

  addNode: (node) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      nodes.set(node.id, node);
      return { nodes };
    }),

  updateNodeStatus: (nodeId, status) =>
    set((state) => {
      const nodes = new Map(state.nodes);
      const node = nodes.get(nodeId);
      if (node) nodes.set(nodeId, { ...node, status });
      return { nodes };
    }),

  selectNode: (nodeId) =>
    set((state) => ({
      selectedNodeIds: state.selectedNodeIds.includes(nodeId)
        ? state.selectedNodeIds
        : [...state.selectedNodeIds, nodeId],
    })),

  deselectNode: (nodeId) =>
    set((state) => ({
      selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
    })),

  focusNode: (nodeId) => set({ focusedNodeId: nodeId }),

  setEvolving: (v) => set({ isEvolving: v }),

  setPendingAction: (action) => set({ pendingAction: action }),

  setActivity: (activity) =>
    set((state) => {
      if (!activity) {
        return { activity: null };
      }

      const nextActivity: ActivityMessage = { ...activity, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, timestamp: Date.now() };
      return {
        activity: nextActivity,
        activityLog: [nextActivity, ...state.activityLog].slice(0, 6),
      };
    }),

  setErrorMessage: (message) => set({ errorMessage: message }),

  clearSelection: () => set({ selectedNodeIds: [], focusedNodeId: null }),

  setBrief: (brief) => set({ brief }),

  reset: () =>
    set({
      ...initialState,
      nodes: new Map<string, IdeaNode>(),
      selectedNodeIds: [],
    }),
}));
