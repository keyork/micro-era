'use client';

import { useCallback } from 'react';
import { useEvolutionStore } from '@/stores/evolutionStore';
import { useLLMConfig } from './useLLMConfig';
import { EvolutionEngine } from '@/lib/engine/evolution';
import * as localStore from '@/lib/store/localStore';
import { IdeaNode } from '@/types/idea';

const NODE_DELAY_MS = 700;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useEvolution(sessionId: string) {
  const addNode = useEvolutionStore((state) => state.addNode);
  const setEvolving = useEvolutionStore((state) => state.setEvolving);
  const updateNodeStatus = useEvolutionStore((state) => state.updateNodeStatus);
  const setBrief = useEvolutionStore((state) => state.setBrief);
  const clearSelection = useEvolutionStore((state) => state.clearSelection);
  const setActivity = useEvolutionStore((state) => state.setActivity);
  const setPendingAction = useEvolutionStore((state) => state.setPendingAction);
  const setErrorMessage = useEvolutionStore((state) => state.setErrorMessage);
  const updateSession = useEvolutionStore((state) => state.updateSession);

  const { config, isConfigured } = useLLMConfig();

  const makeEngine = useCallback(() => {
    if (!isConfigured) {
      throw new Error('先在设置中配好 API Key。');
    }
    return new EvolutionEngine(config);
  }, [config, isConfigured]);

  const runBigBang = useCallback(async () => {
    const session = localStore.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    setEvolving(true);
    setPendingAction('big_bang');
    setErrorMessage(null);
    setActivity({
      title: '正在展开第一批方向',
      detail: '模型正在做首轮发散，节点会逐个出现。',
      tone: 'accent',
    });

    try {
      const engine = makeEngine();
      const nodes = await engine.bigBang(
        sessionId,
        session.seedInput,
        session.contentType,
        session.channelDescription,
      );

      const latestSession = localStore.getSession(sessionId);
      const existingNodes = localStore.getSessionNodes(sessionId);
      if ((latestSession?.currentGeneration ?? 0) > 0 || existingNodes.length > 0) {
        setEvolving(false);
        setPendingAction(null);
        setActivity({
          title: '首轮演化已完成',
          detail: '检测到画板已经有节点，已跳过重复写入。',
          tone: 'success',
        });
        return;
      }

      for (let i = 0; i < nodes.length; i++) {
        localStore.saveNode(nodes[i]);
        setActivity({
          title: i === 0 ? '种子已创建' : '新的分支正在出现',
          detail: `第 ${nodes[i].generation} 代节点加入画板：${nodes[i].title}`,
          tone: 'accent',
        });
        addNode(nodes[i]);
        if (i < nodes.length - 1) {
          await delay(NODE_DELAY_MS);
        }
      }

      const updatedSession = {
        ...session,
        currentGeneration: 1,
        totalNodes: nodes.length,
        updatedAt: new Date().toISOString(),
      };
      localStore.saveSession(updatedSession);
      updateSession({
        currentGeneration: 1,
        totalNodes: nodes.length,
      });

      setEvolving(false);
      setPendingAction(null);
      setErrorMessage(null);
      setActivity({
        title: '这一轮演化完成',
        detail: '已到第 1 代，继续筛选、融合或锁定。',
        tone: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '首轮展开失败，请重试。';
      setEvolving(false);
      setPendingAction(null);
      setErrorMessage(message);
      setActivity({
        title: '演化流程中断',
        detail: message,
        tone: 'error',
      });
      throw error;
    }
  }, [sessionId, addNode, setActivity, setErrorMessage, setEvolving, setPendingAction, updateSession, makeEngine]);

  const runEvolve = useCallback(async (selectedIds: string[], hybridize = false) => {
    const session = localStore.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    setEvolving(true);
    setPendingAction(hybridize ? 'hybridize' : 'evolve');
    setErrorMessage(null);
    setActivity({
      title: hybridize ? '正在融合两条方向' : '正在扩展新的方向',
      detail: hybridize
        ? '两条方向正在交叉组合，评估新的切口。'
        : `围绕你选中的节点继续扩写下一代。`,
      tone: 'accent',
    });

    const store = useEvolutionStore.getState();
    for (const [id, node] of store.nodes) {
      if (node.status === 'active' && !selectedIds.includes(id)) {
        updateNodeStatus(id, 'dormant');
        const updated = { ...node, status: 'dormant' as const };
        localStore.saveNode(updated);
      }
    }

    try {
      const engine = makeEngine();
      const allNodes = localStore.getSessionNodes(sessionId);

      const newNodes = await engine.evolve(
        selectedIds,
        allNodes,
        sessionId,
        session.seedInput,
        session.contentType,
        session.channelDescription,
        session.currentGeneration,
        hybridize,
      );

      for (let i = 0; i < newNodes.length; i++) {
        localStore.saveNode(newNodes[i]);
        setActivity({
          title: '新的分支正在出现',
          detail: `第 ${newNodes[i].generation} 代节点加入画板：${newNodes[i].title}`,
          tone: 'accent',
        });
        addNode(newNodes[i]);
        if (i < newNodes.length - 1) {
          await delay(NODE_DELAY_MS);
        }
      }

      const nextGen = session.currentGeneration + 1;
      const totalCount = (session.totalNodes ?? 0) + newNodes.length;
      const updatedSession = {
        ...session,
        currentGeneration: nextGen,
        totalNodes: totalCount,
        updatedAt: new Date().toISOString(),
      };
      localStore.saveSession(updatedSession);
      updateSession({
        currentGeneration: nextGen,
        totalNodes: totalCount,
      });

      setEvolving(false);
      setPendingAction(null);
      clearSelection();
      setErrorMessage(null);
      setActivity({
        title: '这一轮演化完成',
        detail: `已到第 ${nextGen} 代，继续筛选、融合或锁定。`,
        tone: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '演化失败，请重试。';
      setEvolving(false);
      setPendingAction(null);
      setErrorMessage(message);
      setActivity({
        title: '演化流程中断',
        detail: message,
        tone: 'error',
      });
      throw error;
    }
  }, [sessionId, addNode, clearSelection, setActivity, setErrorMessage, setEvolving, setPendingAction, updateNodeStatus, updateSession, makeEngine]);

  const lockIdea = useCallback(async (nodeId: string) => {
    const session = localStore.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    setPendingAction('lock');
    setErrorMessage(null);
    setActivity({
      title: '正在生成最终 Brief',
      detail: '正在整理成可以直接进入创作的执行提纲。',
      tone: 'accent',
    });

    try {
      const engine = makeEngine();
      const allNodes = localStore.getSessionNodes(sessionId);
      const lockedNode = allNodes.find(n => n.id === nodeId);
      if (!lockedNode) throw new Error('Node not found');

      const brief = await engine.generateBrief(
        lockedNode,
        allNodes,
        session.seedInput,
        session.contentType,
        session.channelDescription,
      );

      localStore.saveBrief(brief);

      lockedNode.status = 'locked';
      localStore.saveNode(lockedNode);
      updateNodeStatus(nodeId, 'locked');

      const updatedSession = {
        ...session,
        lockedIdeaId: nodeId,
        status: 'completed' as const,
        updatedAt: new Date().toISOString(),
      };
      localStore.saveSession(updatedSession);
      updateSession({ lockedIdeaId: nodeId, status: 'completed' });

      setBrief(brief);
      setActivity({
        title: '方向已锁定',
        detail: 'Brief 已准备完成。',
        tone: 'success',
      });
      return brief;
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成 Brief 失败，请重试。';
      setErrorMessage(message);
      setActivity({
        title: '无法生成 Brief',
        detail: message,
        tone: 'error',
      });
      throw error;
    } finally {
      setPendingAction(null);
    }
  }, [sessionId, setActivity, setBrief, setErrorMessage, setPendingAction, updateNodeStatus, updateSession, makeEngine]);

  const reviveNode = useCallback(async (nodeId: string) => {
    setPendingAction('revive');
    setErrorMessage(null);
    setActivity({
      title: '正在复活这个方向',
      detail: '把淘汰分支放回候选池，方便继续比较。',
      tone: 'accent',
    });

    try {
      const nodes = localStore.getSessionNodes(sessionId);
      const node = nodes.find(n => n.id === nodeId);
      if (!node) throw new Error('Node not found');

      node.status = 'active';
      localStore.saveNode(node);
      updateNodeStatus(nodeId, 'active');

      setActivity({
        title: '方向已恢复',
        detail: `"${node.title}" 已重新回到可选状态。`,
        tone: 'success',
      });
      return node;
    } catch (error) {
      const message = error instanceof Error ? error.message : '复活节点失败，请重试。';
      setErrorMessage(message);
      setActivity({
        title: '复活失败',
        detail: message,
        tone: 'error',
      });
      throw error;
    } finally {
      setPendingAction(null);
    }
  }, [sessionId, setActivity, setErrorMessage, setPendingAction, updateNodeStatus]);

  return { runBigBang, runEvolve, lockIdea, reviveNode };
}
