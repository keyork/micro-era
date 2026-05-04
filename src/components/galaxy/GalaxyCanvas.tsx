'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { MUTATION_COLORS } from './IdeaNodeComponent';
import { IdeaNode } from '@/types/idea';
import { ControlBar } from '@/components/panels/ControlBar';
import { NodeDetail } from '@/components/panels/NodeDetail';
import { BriefPanel } from '@/components/panels/BriefPanel';
import { CanvasStatusBanner } from './CanvasStatusBanner';
import { CanvasSidebar } from './CanvasSidebar';
import { CanvasGuideCard } from './CanvasGuideCard';
import { api } from '@/lib/api';
import { NebulaBackdrop } from './NebulaBackdrop';
import { REACT_FLOW_EDGE_TYPES, REACT_FLOW_NODE_TYPES } from './reactFlowTypes';

interface Props {
  sessionId: string;
}

const bootstrappingSessions = new Set<string>();

export function GalaxyCanvas({ sessionId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpenBrief = searchParams.get('brief') === '1';
  const ideaNodes = useEvolutionStore((state) => state.nodes);
  const selectedNodeIds = useEvolutionStore((state) => state.selectedNodeIds);
  const focusedNodeId = useEvolutionStore((state) => state.focusedNodeId);
  const brief = useEvolutionStore((state) => state.brief);
  const session = useEvolutionStore((state) => state.session);
  const activity = useEvolutionStore((state) => state.activity);
  const activityLog = useEvolutionStore((state) => state.activityLog);
  const pendingAction = useEvolutionStore((state) => state.pendingAction);
  const errorMessage = useEvolutionStore((state) => state.errorMessage);
  const focusNode = useEvolutionStore((state) => state.focusNode);
  const selectNode = useEvolutionStore((state) => state.selectNode);
  const deselectNode = useEvolutionStore((state) => state.deselectNode);
  const setSession = useEvolutionStore((state) => state.setSession);
  const setNodes = useEvolutionStore((state) => state.setNodes);
  const reset = useEvolutionStore((state) => state.reset);
  const setActivity = useEvolutionStore((state) => state.setActivity);
  const setPendingAction = useEvolutionStore((state) => state.setPendingAction);
  const setErrorMessage = useEvolutionStore((state) => state.setErrorMessage);
  const setBrief = useEvolutionStore((state) => state.setBrief);
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const [draggedPositions, setDraggedPositions] = useState<Record<string, XYPosition>>({});
  const loadedSessionRef = useRef<string | null>(null);

  const { runBigBang, runEvolve, lockIdea, reviveNode } = useEvolution(sessionId);
  const { isConfigured, isLoaded } = useLLMConfig();
  const nodeTypes = useMemo(() => REACT_FLOW_NODE_TYPES, []);
  const edgeTypes = useMemo(() => REACT_FLOW_EDGE_TYPES, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (loadedSessionRef.current === sessionId) return;
    loadedSessionRef.current = sessionId;

    let cancelled = false;
    reset();
    setDraggedPositions({});
    setPendingAction(null);
    setErrorMessage(null);
    setActivity({
      title: '正在同步会话',
      detail: '读取会话信息和已有节点。',
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
        setBrief(shouldOpenBrief ? api.getBrief(sessionId) : null);

        if (sessionData.currentGeneration === 0 && nodes.length === 0) {
          if (!isConfigured) {
            setActivity({
              title: '还没有配置 API Key',
              detail: '返回首页在「API 设置」中配好你的 Key。',
              tone: 'warning',
            });
            setErrorMessage('请先配置 API Key。');
            return;
          }
          if (bootstrappingSessions.has(sessionId)) {
            setActivity({
              title: '首轮演化正在进行',
              detail: '模型已经开始生成第一批方向，请稍候。',
              tone: 'accent',
            });
            return;
          }

          bootstrappingSessions.add(sessionId);
          try {
            await runBigBang();
          } finally {
            bootstrappingSessions.delete(sessionId);
          }
        } else {
          setActivity({
            title: '会话已同步',
            detail: `已恢复 ${nodes.length} 个节点，继续筛选、扩写或锁定。`,
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
  }, [isLoaded, reset, sessionId, setActivity, setBrief, setErrorMessage, setNodes, setPendingAction, setSession, shouldOpenBrief, isConfigured, runBigBang]);

  const nodes = useMemo(() => Array.from(ideaNodes.values()), [ideaNodes]);
  const currentGeneration = useMemo(
    () => nodes.reduce((max, node) => Math.max(max, node.generation), session?.currentGeneration ?? 0),
    [nodes, session?.currentGeneration],
  );

  useEffect(() => {
    const displayNodes = nodes.map((node) => {
      const isActuallySelected = selectedNodeIds.includes(node.id);
      if (isActuallySelected && node.status === 'active') {
        return { ...node, status: 'selected' as const };
      }
      if (!isActuallySelected && node.status === 'selected') {
        return { ...node, status: 'active' as const };
      }
      return node;
    });
    const computedPositions = computeLayout(displayNodes);

    const rfN: Node<IdeaNode>[] = displayNodes.map((n) => {
      const pos = draggedPositions[n.id] ?? computedPositions.get(n.id) ?? { x: 0, y: 0 };
      return {
        id: n.id,
        type: 'ideaNode',
        position: pos,
        data: { ...n },
        selected: false,
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
    (_, node) => {
      const idea = ideaNodes.get(node.id);
      if (idea?.status !== 'dormant') return;

      void reviveNode(node.id).catch(() => {
        // Error state is already written into the store by useEvolution.
      });
    },
    [ideaNodes, reviveNode],
  );

  const handleEvolve = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    void runEvolve(selectedNodeIds, false).catch(() => {
      // Error state is already written into the store by useEvolution.
    });
  }, [selectedNodeIds, runEvolve]);

  const handleHybridize = useCallback(() => {
    if (selectedNodeIds.length !== 2) return;
    void runEvolve(selectedNodeIds, true).catch(() => {
      // Error state is already written into the store by useEvolution.
    });
  }, [selectedNodeIds, runEvolve]);

  const handleLock = useCallback(() => {
    if (selectedNodeIds.length !== 1) return;
    void lockIdea(selectedNodeIds[0]).catch(() => {
      // Error state is already written into the store by useEvolution.
    });
  }, [selectedNodeIds, lockIdea]);

  const focusedIdea = focusedNodeId ? ideaNodes.get(focusedNodeId) ?? null : null;
  const topMetrics = [
    ['状态', isConfigured ? '就绪' : '未配置'],
    ['代数', String(currentGeneration)],
    ['节点', String(nodes.length)],
  ];

  return (
    <div className="galaxy-canvas cosmic-grain relative h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
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

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        {topMetrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-[16px] px-4 py-2.5"
            style={{
              background: 'rgba(3,5,14,0.84)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(180,200,255,0.07)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <p className="text-[9px] uppercase tracking-[0.22em] hud-text" style={{ color: 'var(--text-muted)' }}>
              {label}
            </p>
            <p className="mt-0.5 text-sm font-semibold hud-text" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="absolute left-4 top-4 z-40">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] hud-text transition-all duration-300"
          style={{
            background: 'rgba(3,5,14,0.84)',
            color: 'var(--text-secondary)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(180,200,255,0.07)',
            backdropFilter: 'blur(20px)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
        >
          <span style={{ color: 'var(--color-teal)' }}>←</span>
          返回主页
        </button>
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
