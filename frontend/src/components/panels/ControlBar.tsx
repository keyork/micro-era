'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEvolutionStore } from '@/stores/evolutionStore';
import { GlowButton } from '@/components/ui/GlowButton';
import { ConnectionStatus, PendingAction } from '@/types/idea';

interface Props {
  selectedCount: number;
  connectionStatus: ConnectionStatus;
  pendingAction: PendingAction;
  onEvolve: () => void;
  onHybridize: () => void;
  onLock: () => void;
}

function getHelperCopy(selectedCount: number, connected: boolean): { title: string; detail: string } {
  if (!connected) {
    return {
      title: '正在连接实时引擎',
      detail: '连接完成后第一批方向会自动出现，你不需要重复操作。',
    };
  }

  if (selectedCount === 0) {
    return {
      title: '先保留一个最想继续看的方向',
      detail: '点选 1 个节点就够了。双击灰色节点可以把淘汰分支重新拉回来。',
    };
  }

  if (selectedCount === 1) {
    return {
      title: '这个方向已经可以继续推进了',
      detail: '如果它已经够清晰，就锁定成 Brief；如果还想多看几个变体，就先扩写。',
    };
  }

  if (selectedCount === 2) {
    return {
      title: '现在最适合做交叉融合',
      detail: '两个方向各有亮点时，把它们混在一起，往往能得到更有新意的切口。',
    };
  }

  return {
    title: '先把候选收窄到 1-2 个',
    detail: '选太多时，系统给出的下一步会变得不够聚焦。',
  };
}

const PENDING_LABELS: Record<Exclude<PendingAction, null>, string> = {
  bootstrap: '同步中',
  big_bang: '首轮展开中',
  evolve: '扩写中',
  hybridize: '融合中',
  lock: '生成 Brief 中',
  revive: '复活中',
};

export function ControlBar({ selectedCount, connectionStatus, pendingAction, onEvolve, onHybridize, onLock }: Props) {
  const { isEvolving } = useEvolutionStore();
  const connected = connectionStatus === 'connected';
  const isBusy = isEvolving || pendingAction !== null;

  const canEvolve = selectedCount >= 1 && !isBusy && connected;
  const canHybridize = selectedCount === 2 && !isBusy && connected;
  const canLock = selectedCount === 1 && !isBusy;
  const helper = getHelperCopy(selectedCount, connected);

  const connectionColor = connected ? 'var(--color-teal)' : 'var(--color-gold)';
  const connectionBg = connected ? 'rgba(83,198,175,0.12)' : 'rgba(241,198,109,0.10)';

  return (
    <div
      className="absolute bottom-5 left-1/2 z-20 w-[min(920px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-[28px] px-5 py-4"
      style={{
        background: 'rgba(8,12,22,0.90)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 20px 80px rgba(0,0,0,0.40)',
        backdropFilter: 'blur(22px)',
      }}
    >
      <div className="flex items-center justify-between gap-5">
        {/* Left: status badges + helper text */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Connection status */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ background: connectionBg, color: connectionColor }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: connectionColor }}
              />
              {connected ? 'Live' : 'Connecting'}
            </span>

            {/* Selection count */}
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
            >
              已选 {selectedCount}
            </span>

            {/* Pending action badge */}
            <AnimatePresence>
              {pendingAction && (
                <motion.span
                  key={pendingAction}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
                  style={{ background: 'rgba(111,119,255,0.14)', color: 'var(--color-primary)' }}
                >
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--color-primary)' }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  {PENDING_LABELS[pendingAction]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {helper.title}
            </p>
            <p className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
              {helper.detail}
            </p>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          <GlowButton onClick={onEvolve} variant="primary" disabled={!canEvolve}>
            继续扩写
          </GlowButton>
          <GlowButton
            onClick={onHybridize}
            variant="ghost"
            disabled={!canHybridize}
            style={{ borderColor: canHybridize ? 'var(--color-teal)' : undefined, color: canHybridize ? 'var(--color-teal)' : undefined }}
          >
            融合方向
          </GlowButton>
          <GlowButton onClick={onLock} variant="gold" disabled={!canLock}>
            锁定成 Brief
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
