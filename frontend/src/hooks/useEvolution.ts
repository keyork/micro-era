'use client';

import { useCallback } from 'react';
import { useEvolutionStore } from '@/stores/evolutionStore';
import { api } from '@/lib/api';
import { IdeaNode, WSEvent } from '@/types/idea';

export function useEvolution(sessionId: string) {
  const {
    addNode,
    setEvolving,
    updateNodeStatus,
    setBrief,
    clearSelection,
    setActivity,
    setPendingAction,
    setErrorMessage,
    updateSession,
  } = useEvolutionStore();

  const handleWSEvent = useCallback(
    (event: WSEvent) => {
      switch (event.type) {
        case 'node_emerging': {
          if (!useEvolutionStore.getState().pendingAction) {
            setPendingAction('big_bang');
          }
          setActivity({
            title: event.node.generation <= 1 ? '第一批方向正在展开' : '新的分支正在出现',
            detail: `正在把第 ${event.node.generation} 代候选节点加入画板：${event.node.title}`,
            tone: 'accent',
          });

          const delay = event.delay ?? 0;
          setTimeout(() => {
            const node: IdeaNode = {
              ...event.node,
            };
            addNode(node);
          }, delay);
          break;
        }
        case 'evolution_complete':
          setEvolving(false);
          setPendingAction(null);
          clearSelection();
          updateSession({ currentGeneration: event.generation });
          setErrorMessage(null);
          setActivity({
            title: '这一轮进化完成',
            detail: `已生成到第 ${event.generation} 代，你可以继续筛选、融合或锁定方向。`,
            tone: 'success',
          });
          break;
        case 'brief_generated':
          setBrief(event.brief);
          setPendingAction(null);
          setActivity({
            title: 'Brief 已生成',
            detail: '最终方向已经整理为可执行的内容 Brief。',
            tone: 'success',
          });
          break;
        case 'error':
          console.warn('Evolution error:', event.message);
          setEvolving(false);
          setPendingAction(null);
          setErrorMessage(event.message);
          setActivity({
            title: '演化流程中断',
            detail: event.message,
            tone: 'error',
          });
          break;
      }
    },
    [addNode, clearSelection, setActivity, setBrief, setErrorMessage, setEvolving, setPendingAction, updateSession],
  );

  const triggerEvolve = useCallback(
    async (send: (msg: object) => boolean, selectedIds: string[], hybridize = false) => {
      setEvolving(true);
      setPendingAction(hybridize ? 'hybridize' : 'evolve');
      setErrorMessage(null);
      setActivity({
        title: hybridize ? '正在融合两条方向' : '正在扩展新的方向',
        detail: hybridize
          ? '系统会把两条已选方向交叉组合，并评估新的内容切口。'
          : `系统会围绕你选中的 ${selectedIds.length} 个节点继续扩写下一代候选。`,
        tone: 'accent',
      });

      const store = useEvolutionStore.getState();
      for (const [id, node] of store.nodes) {
        if (node.status === 'active' && !selectedIds.includes(id)) {
          updateNodeStatus(id, 'dormant');
        }
      }

      const sent = send({ type: 'start_evolution', selectedIds, hybridize });
      if (!sent) {
        setEvolving(false);
        setPendingAction(null);
        setErrorMessage('实时连接尚未就绪，请稍后再试。');
        setActivity({
          title: '暂时无法发送演化请求',
          detail: 'WebSocket 还没有连接完成，稍等 1-2 秒后重试。',
          tone: 'warning',
        });
      }
    },
    [setActivity, setErrorMessage, setEvolving, setPendingAction, updateNodeStatus],
  );

  const lockIdea = useCallback(
    async (nodeId: string) => {
      setPendingAction('lock');
      setErrorMessage(null);
      setActivity({
        title: '正在生成最终 Brief',
        detail: '系统会把当前方向整理成可直接进入创作的执行提纲。',
        tone: 'accent',
      });

      try {
        const brief = await api.lockIdea(sessionId, nodeId);
        setBrief(brief);
        updateNodeStatus(nodeId, 'locked');
        updateSession({ lockedIdeaId: nodeId, status: 'completed' });
        setActivity({
          title: '方向已锁定',
          detail: '最终 Brief 已经准备完成。',
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
    },
    [sessionId, setActivity, setBrief, setErrorMessage, setPendingAction, updateNodeStatus, updateSession],
  );

  const reviveNode = useCallback(
    async (nodeId: string) => {
      setPendingAction('revive');
      setErrorMessage(null);
      setActivity({
        title: '正在复活这个方向',
        detail: '把已淘汰分支重新放回当前候选池，方便继续比较。',
        tone: 'accent',
      });

      try {
        const node = await api.reviveNode(sessionId, nodeId);
        updateNodeStatus(nodeId, 'active');
        setActivity({
          title: '方向已恢复',
          detail: `“${node.title}” 已重新回到可选状态。`,
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
    },
    [sessionId, setActivity, setErrorMessage, setPendingAction, updateNodeStatus],
  );

  return { handleWSEvent, triggerEvolve, lockIdea, reviveNode };
}
