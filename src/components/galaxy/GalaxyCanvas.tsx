'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  XYPosition,
  Node,
  Edge,
  NodeDragHandler,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useEvolutionStore } from '@/stores/evolutionStore';
import { useEvolution } from '@/hooks/useEvolution';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { computeLayout } from './GalaxyLayout';
import { IdeaNodeComponent, MUTATION_COLORS } from './IdeaNodeComponent';
import { EdgeComponent } from './EdgeComponent';
import { IdeaNode } from '@/types/idea';
import { ControlBar } from '@/components/panels/ControlBar';
import { NodeDetail } from '@/components/panels/NodeDetail';
import { BriefPanel } from '@/components/panels/BriefPanel';
import { CanvasStatusBanner } from './CanvasStatusBanner';
import { CanvasSidebar } from './CanvasSidebar';
import { CanvasGuideCard } from './CanvasGuideCard';
import { api } from '@/lib/api';
import { NebulaBackdrop } from './NebulaBackdrop';

const nodeTypes = { ideaNode: IdeaNodeComponent } as const;
const edgeTypes = { evolutionEdge: EdgeComponent } as const;

interface Props {
  sessionId: string;
}

export function GalaxyCanvas({ sessionId }: Props) {
  const {
    nodes: ideaNodes,
    selectedNodeIds,
    focusedNodeId,
    brief,
    session,
    activity,
    activityLog,
    pendingAction,
    errorMessage,
    focusNode,
    selectNode,
    deselectNode,
    setSession,
    setNodes,
    reset,
    setActivity,
    setPendingAction,
    setErrorMessage,
  } = useEvolutionStore();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const [draggedPositions, setDraggedPositions] = useState<Record<string, XYPosition>>({});

  const { runBigBang, runEvolve, lockIdea, reviveNode } = useEvolution(sessionId);
  const { isConfigured, isLoaded } = useLLMConfig();

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    reset();
    setDraggedPositions({});
    setPendingAction(null);
    setErrorMessage(null);
    setActivity({
      title: '正在同步当前会话',
      detail: '先读取已有会话信息和节点。',
      tone: 'accent',
    });

    const bootstrap = async () => {
      try {
        const sessionData = api.getSession(sessionId);
        if (!sessionData) {
          throw new Error('会话不存在，请返回首页重新创建。');
        }
        if (cancelled) return;

        setSession(sessionData);
        const nodes = api.getSessionNodes(sessionId);
        setNodes(nodes);

        if (sessionData.currentGeneration === 0 && nodes.length === 0) {
          if (!isConfigured) {
            setActivity({
              title: '请先配置 API Key',
              detail: '返回首页在「API 设置」面板中配置你的 API Key。',
              tone: 'warning',
            });
            setErrorMessage('请先配置 API Key。');
            return;
          }
          await runBigBang();
        } else {
          setActivity({
            title: '会话已同步',
            detail: `已恢复 ${nodes.length} 个节点，可以继续筛选、扩写或锁定方向。`,
            tone: 'success',
          });
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : '读取会话失败，请刷新后重试。';
        setPendingAction(null);
        setErrorMessage(message);
        setActivity({
          title: '无法加载当前会话',
          detail: message,
          tone: 'error',
        });
      }
    };

    void bootstrap();
    return () => { cancelled = true; };
  }, [isLoaded, reset, sessionId, setActivity, setErrorMessage, setNodes, setPendingAction, setSession, isConfigured, runBigBang]);

  const nodes = useMemo(() => Array.from(ideaNodes.values()), [ideaNodes]);
  const currentGeneration = useMemo(
    () => nodes.reduce((max, node) => Math.max(max, node.generation), session?.currentGeneration ?? 0),
    [nodes, session?.currentGeneration],
  );

  useEffect(() => {
    const displayNodes = nodes.map((node) =>
      selectedNodeIds.includes(node.id) && node.status === 'active'
        ? { ...node, status: 'selected' as const }
        : node,
    );
    const computedPositions = computeLayout(displayNodes);

    const rfN: Node<IdeaNode>[] = displayNodes.map((n) => {
      const pos = draggedPositions[n.id] ?? computedPositions.get(n.id) ?? { x: 0, y: 0 };
      return {
        id: n.id,
        type: 'ideaNode',
        position: pos,
        data: { ...n },
        selected: n.status === 'selected',
      };
    });

    const rfE: Edge[] = [];
    for (const n of nodes) {
      for (const pid of n.parentIds) {
        const isHybrid = n.mutationType === 'hybrid';
        const parent = ideaNodes.get(pid);
        rfE.push({
          id: `${pid}-${n.id}`,
          source: pid,
          target: n.id,
          type: 'evolutionEdge',
          data: {
            isHybrid,
            color: MUTATION_COLORS[n.mutationType],
            sourceColor: parent ? MUTATION_COLORS[parent.mutationType] : MUTATION_COLORS[n.mutationType],
            targetColor: MUTATION_COLORS[n.mutationType],
          },
        });
      }
    }

    setRfNodes(rfN);
    setRfEdges(rfE);
  }, [draggedPositions, ideaNodes, nodes, selectedNodeIds, setRfEdges, setRfNodes]);

  const onNodeDragStop: NodeDragHandler = useCallback((_, node) => {
    setDraggedPositions((current) => ({
      ...current,
      [node.id]: node.position,
    }));
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const id = node.id;
      const idea = ideaNodes.get(id);

      if (idea?.status === 'dormant' || idea?.status === 'locked') {
        focusNode(id);
        return;
      }

      if (selectedNodeIds.includes(id)) {
        deselectNode(id);
      } else {
        selectNode(id);
      }
      focusNode(id);
    },
    [deselectNode, focusNode, ideaNodes, selectNode, selectedNodeIds],
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
    await runEvolve(selectedNodeIds, false);
  }, [selectedNodeIds, runEvolve]);

  const handleHybridize = useCallback(async () => {
    if (selectedNodeIds.length !== 2) return;
    await runEvolve(selectedNodeIds, true);
  }, [selectedNodeIds, runEvolve]);

  const handleLock = useCallback(async () => {
    if (selectedNodeIds.length !== 1) return;
    await lockIdea(selectedNodeIds[0]);
  }, [selectedNodeIds, lockIdea]);

  const focusedIdea = focusedNodeId ? ideaNodes.get(focusedNodeId) ?? null : null;
  const topMetrics = [
    ['状态', isConfigured ? '就绪' : '未配置'],
    ['代数', String(currentGeneration)],
    ['节点', String(nodes.length)],
  ];

  return (
    <div className="cosmic-grain relative h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      <NebulaBackdrop />

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => focusNode(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.24 }}
        minZoom={0.2}
        maxZoom={3}
        nodesDraggable
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(255,255,255,0.10)" gap={42} size={1.2} />
        <Controls
          style={{
            background: 'rgba(8,14,24,0.72)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 50px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        />
      </ReactFlow>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 46%, rgba(2,4,9,0.52) 100%)',
        }}
      />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
        {topMetrics.map(([label, value]) => (
          <div
            key={label}
            className="glass-panel rounded-2xl px-4 py-3"
          >
            <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              {label}
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <CanvasSidebar
        session={session}
        selectedCount={selectedNodeIds.length}
        totalNodes={nodes.length}
        currentGeneration={currentGeneration}
        focusedIdea={focusedIdea}
        activityLog={activityLog}
      />
      <CanvasGuideCard
        selectedCount={selectedNodeIds.length}
        currentGeneration={currentGeneration}
        totalNodes={nodes.length}
        pendingAction={pendingAction}
        focusedIdea={focusedIdea}
      />
      <CanvasStatusBanner
        activity={activity}
        pendingAction={pendingAction}
        errorMessage={errorMessage}
      />
      <ControlBar
        selectedCount={selectedNodeIds.length}
        pendingAction={pendingAction}
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
