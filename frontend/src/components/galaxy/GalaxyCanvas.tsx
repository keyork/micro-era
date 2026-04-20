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
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEvolution } from '@/hooks/useEvolution';
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

const nodeTypes = { ideaNode: IdeaNodeComponent };
const edgeTypes = { evolutionEdge: EdgeComponent };

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
    connectionStatus,
    errorMessage,
    hasBootstrapped,
    focusNode,
    selectNode,
    deselectNode,
    setSession,
    setNodes,
    reset,
    setActivity,
    setPendingAction,
    setConnectionStatus,
    setErrorMessage,
    setHasBootstrapped,
  } = useEvolutionStore();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const [socketEnabled, setSocketEnabled] = useState(false);
  const [draggedPositions, setDraggedPositions] = useState<Record<string, XYPosition>>({});

  const { handleWSEvent, triggerEvolve, lockIdea, reviveNode } = useEvolution(sessionId);
  const { send } = useWebSocket({
    sessionId,
    onEvent: handleWSEvent,
    enabled: socketEnabled,
    onStatusChange: (status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        const { pendingAction: nextPendingAction } = useEvolutionStore.getState();
        setErrorMessage(null);
        if (nextPendingAction === 'big_bang' || nextPendingAction === 'bootstrap') {
          setActivity({
            title: '实时连接已建立',
            detail: '连接已经就绪，系统正在生成第一批候选方向。',
            tone: 'accent',
          });
        } else {
          setActivity({
            title: '实时连接已建立',
            detail: '节点会逐步出现在画板上，你可以随时点选并继续演化。',
            tone: 'success',
          });
        }
      }
      if (status === 'disconnected') {
        setActivity({
          title: '实时连接已断开',
          detail: '当前画板仍可浏览，但新的进化请求暂时无法发送。',
          tone: 'warning',
        });
      }
    },
  });

  useEffect(() => {
    let cancelled = false;

    reset();
    setSocketEnabled(false);
    setDraggedPositions({});
    setConnectionStatus('connecting');
    setPendingAction('bootstrap');
    setHasBootstrapped(false);
    setErrorMessage(null);
    setActivity({
      title: '正在同步当前会话',
      detail: '先读取已有会话信息和节点，再连接实时演化引擎。',
      tone: 'accent',
    });

    const bootstrap = async () => {
      try {
        const [sessionData, nodes] = await Promise.all([
          api.getSession(sessionId),
          api.getSessionNodes(sessionId),
        ]);

        if (cancelled) {
          return;
        }

        setSession(sessionData);
        setNodes(nodes);
        setHasBootstrapped(true);

        if (sessionData.currentGeneration === 0 && nodes.length === 0) {
          setPendingAction('big_bang');
          setActivity({
            title: '正在展开第一批方向',
            detail: '这一步需要等待模型完成首轮发散，你会看到节点逐个出现。',
            tone: 'accent',
          });
        } else {
          setPendingAction(null);
          setActivity({
            title: '会话已同步',
            detail: `已恢复 ${nodes.length} 个节点，可以继续筛选、扩写或锁定方向。`,
            tone: 'success',
          });
        }

        setSocketEnabled(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : '读取会话失败，请刷新后重试。';
        setPendingAction(null);
        setHasBootstrapped(true);
        setErrorMessage(message);
        setActivity({
          title: '无法加载当前会话',
          detail: message,
          tone: 'error',
        });
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    reset,
    sessionId,
    setActivity,
    setConnectionStatus,
    setErrorMessage,
    setHasBootstrapped,
    setNodes,
    setPendingAction,
    setSession,
  ]);

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
  const topMetrics = [
    ['连接', connectionStatus === 'connected' ? '在线' : connectionStatus === 'connecting' ? '连接中' : '已断开'],
    ['代数', String(currentGeneration)],
    ['节点', String(nodes.length)],
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
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
        <Background variant={BackgroundVariant.Dots} color="rgba(255,255,255,0.12)" gap={42} size={1.2} />
        <Controls
          style={{
            background: 'rgba(8,14,24,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 12px 50px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(18px)',
          }}
        />
      </ReactFlow>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, transparent 48%, rgba(2,4,9,0.48) 100%)',
        }}
      />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
        {topMetrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl px-4 py-3"
            style={{
              background: 'rgba(10,14,24,0.82)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 16px 60px rgba(0,0,0,0.24)',
              backdropFilter: 'blur(18px)',
            }}
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
        connectionStatus={connectionStatus}
        activityLog={activityLog}
      />
      <CanvasGuideCard
        selectedCount={selectedNodeIds.length}
        currentGeneration={currentGeneration}
        totalNodes={nodes.length}
        connectionStatus={connectionStatus}
        pendingAction={pendingAction}
        focusedIdea={focusedIdea}
      />
      <CanvasStatusBanner
        activity={activity}
        connectionStatus={connectionStatus}
        pendingAction={pendingAction}
        hasBootstrapped={hasBootstrapped}
        errorMessage={errorMessage}
      />
      <ControlBar
        selectedCount={selectedNodeIds.length}
        connectionStatus={connectionStatus}
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
