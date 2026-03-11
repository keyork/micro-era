'use client';

import { useCallback } from 'react';
import { useEvolutionStore } from '@/stores/evolutionStore';
import { api } from '@/lib/api';
import { IdeaNode, WSEvent } from '@/types/idea';

export function useEvolution(sessionId: string) {
  const { addNode, setEvolving, updateNodeStatus, setBrief, session } = useEvolutionStore();

  const handleWSEvent = useCallback(
    (event: WSEvent) => {
      switch (event.type) {
        case 'node_emerging': {
          // Apply delay from server for staggered animation
          const delay = event.delay ?? 0;
          setTimeout(() => {
            const node: IdeaNode = {
              ...event.node,
              // snake_case → camelCase normalisation (server sends camelCase already)
            };
            addNode(node);
          }, delay);
          break;
        }
        case 'evolution_complete':
          setEvolving(false);
          break;
        case 'brief_generated':
          setBrief(event.brief);
          break;
        case 'error':
          console.error('Evolution error:', event.message);
          setEvolving(false);
          break;
      }
    },
    [addNode, setEvolving, setBrief],
  );

  const triggerEvolve = useCallback(
    async (send: (msg: object) => void, selectedIds: string[], hybridize = false) => {
      setEvolving(true);
      // Mark unselected active nodes as dormant
      const store = useEvolutionStore.getState();
      for (const [id, node] of store.nodes) {
        if (node.status === 'active' && !selectedIds.includes(id)) {
          updateNodeStatus(id, 'dormant');
        }
      }
      send({ type: 'start_evolution', selectedIds, hybridize });
    },
    [setEvolving, updateNodeStatus],
  );

  const lockIdea = useCallback(
    async (nodeId: string) => {
      const brief = await api.lockIdea(sessionId, nodeId);
      setBrief(brief);
      updateNodeStatus(nodeId, 'locked');
      return brief;
    },
    [sessionId, setBrief, updateNodeStatus],
  );

  const reviveNode = useCallback(
    async (nodeId: string) => {
      const node = await api.reviveNode(sessionId, nodeId);
      updateNodeStatus(nodeId, 'active');
      return node;
    },
    [sessionId, updateNodeStatus],
  );

  return { handleWSEvent, triggerEvolve, lockIdea, reviveNode };
}
