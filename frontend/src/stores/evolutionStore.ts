import { create } from 'zustand';
import { IdeaBrief, IdeaNode, NodeStatus, EvolutionSession } from '@/types/idea';

interface EvolutionStore {
  // Session
  session: EvolutionSession | null;

  // Node tree (Map for O(1) lookup)
  nodes: Map<string, IdeaNode>;

  // UI state
  selectedNodeIds: string[];
  focusedNodeId: string | null;
  isEvolving: boolean;

  // Brief
  brief: IdeaBrief | null;

  // Actions
  setSession: (session: EvolutionSession) => void;
  addNode: (node: IdeaNode) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
  selectNode: (nodeId: string) => void;
  deselectNode: (nodeId: string) => void;
  focusNode: (nodeId: string | null) => void;
  setEvolving: (v: boolean) => void;
  setBrief: (brief: IdeaBrief) => void;
  reset: () => void;
}

const initialState = {
  session: null,
  nodes: new Map<string, IdeaNode>(),
  selectedNodeIds: [] as string[],
  focusedNodeId: null,
  isEvolving: false,
  brief: null,
};

export const useEvolutionStore = create<EvolutionStore>((set) => ({
  ...initialState,

  setSession: (session) => set({ session }),

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

  setBrief: (brief) => set({ brief }),

  reset: () =>
    set({
      ...initialState,
      nodes: new Map<string, IdeaNode>(),
      selectedNodeIds: [],
    }),
}));
