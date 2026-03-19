'use client';

import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useEvolutionStore } from '@/stores/evolutionStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEvolution } from '@/hooks/useEvolution';
import { computeLayout } from './GalaxyLayout';
import { IdeaNodeComponent } from './IdeaNodeComponent';
import { EdgeComponent } from './EdgeComponent';
import { IdeaNode } from '@/types/idea';
import { ControlBar } from '@/components/panels/ControlBar';
import { NodeDetail } from '@/components/panels/NodeDetail';
import { BriefPanel } from '@/components/panels/BriefPanel';

const nodeTypes = { ideaNode: IdeaNodeComponent };
const edgeTypes = { evolutionEdge: EdgeComponent };

interface Props {
  sessionId: string;
}

export function GalaxyCanvas({ sessionId }: Props) {
  const { nodes: ideaNodes, selectedNodeIds, focusedNodeId, brief, focusNode, selectNode, deselectNode } = useEvolutionStore();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  const { handleWSEvent, triggerEvolve, lockIdea, reviveNode } = useEvolution(sessionId);
  const { send } = useWebSocket({ sessionId, onEvent: handleWSEvent });

  // Recompute React Flow nodes/edges whenever the store changes
  useEffect(() => {
    const nodes = Array.from(ideaNodes.values());
    const positions = computeLayout(nodes);

    const rfN: Node<IdeaNode>[] = nodes.map((n) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 };
      return {
        id: n.id,
        type: 'ideaNode',
        position: pos,
        data: { ...n },
        selected: selectedNodeIds.includes(n.id),
      };
    });

    const rfE: Edge[] = [];
    for (const n of nodes) {
      for (const pid of n.parentIds) {
        const isHybrid = n.mutationType === 'hybrid';
        rfE.push({
          id: `${pid}-${n.id}`,
          source: pid,
          target: n.id,
          type: 'evolutionEdge',
          data: { isHybrid },
        });
      }
    }

    setRfNodes(rfN);
    setRfEdges(rfE);
  }, [ideaNodes, selectedNodeIds, setRfNodes, setRfEdges]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const id = node.id;
      if (selectedNodeIds.includes(id)) {
        deselectNode(id);
      } else {
        selectNode(id);
      }
      focusNode(id);
    },
    [selectedNodeIds, selectNode, deselectNode, focusNode],
  );

  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    async (_, node) => {
      const idea = ideaNodes.get(node.id);
      if (idea?.status === 'dormant') {
        await reviveNode(node.id);
      }
    },
    [ideaNodes, reviveNode],
  );

  const handleEvolve = useCallback(async () => {
    if (selectedNodeIds.length === 0) return;
    await triggerEvolve(send, selectedNodeIds, false);
  }, [selectedNodeIds, triggerEvolve, send]);

  const handleHybridize = useCallback(async () => {
    if (selectedNodeIds.length !== 2) return;
    await triggerEvolve(send, selectedNodeIds, true);
  }, [selectedNodeIds, triggerEvolve, send]);

  const handleLock = useCallback(async () => {
    if (selectedNodeIds.length !== 1) return;
    await lockIdea(selectedNodeIds[0]);
  }, [selectedNodeIds, lockIdea]);

  const focusedIdea = focusedNodeId ? ideaNodes.get(focusedNodeId) ?? null : null;

  return (
    <div className="w-screen h-screen relative" style={{ background: 'var(--bg-deep)' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e1e35" gap={40} size={1} />
        <Controls
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
        />
      </ReactFlow>

      {/* Overlays */}
      <ControlBar
        selectedCount={selectedNodeIds.length}
        onEvolve={handleEvolve}
        onHybridize={handleHybridize}
        onLock={handleLock}
      />
      {focusedIdea && (
        <NodeDetail idea={focusedIdea} onClose={() => focusNode(null)} />
      )}
      {brief && <BriefPanel brief={brief} />}
    </div>
  );
}
