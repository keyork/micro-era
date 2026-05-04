'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEvolutionStore } from '@/stores/evolutionStore';
import { GlowButton } from '@/components/ui/GlowButton';
import { PendingAction } from '@/types/idea';

interface Props {
  selectedCount: number;
  pendingAction: PendingAction;
  onEvolve: () => void;
  onHybridize: () => void;
  onLock: () => void;
}

function getHelperCopy(selectedCount: number): { title: string; detail: string } {
  if (selectedCount === 0) {
    return {
      title: '先选一个最想继续的方向',
      detail: '选 1 个节点就够了。双击灰色节点可以恢复淘汰分支。',
    };
  }

  if (selectedCount === 1) {
    return {
      title: '这个方向可以继续推进了',
      detail: '够清晰就锁定成 Brief，还想多看看就扩写。',
    };
  }

  if (selectedCount === 2) {
    return {
      title: '现在适合做交叉融合',
      detail: '两个方向各有亮点时，混在一起往往能碰撞出新切口。',
    };
  }

  return {
    title: '先把选择收窄到 1-2 个',
    detail: '选太多时，下一步会不够聚焦。',
  };
}

const PENDING_LABELS: Record<Exclude<PendingAction, null>, string> = {
  big_bang: '首轮展开中',
  evolve: '扩写中',
  hybridize: '融合中',
  lock: '生成 Brief 中',
  revive: '复活中',
};

export function ControlBar({ selectedCount, pendingAction, onEvolve, onHybridize, onLock }: Props) {
  const { isEvolving } = useEvolutionStore();
  const isBusy = isEvolving || pendingAction !== null;

  const canEvolve = selectedCount >= 1 && !isBusy;
  const canHybridize = selectedCount === 2 && !isBusy;
  const canLock = selectedCount === 1 && !isBusy;
  const helper = getHelperCopy(selectedCount);

  return (
    <div
      className="absolute bottom-5 left-1/2 z-20 w-[min(940px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-[26px] px-5 py-4"
      style={{
        background: 'rgba(2, 4, 12, 0.92)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 24px 90px rgba(0,0,0,0.56), inset 0 1px 0 rgba(180,200,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.02)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      }}
    >
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] hud-text"
              style={{ background: 'rgba(255,255,255,0.035)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              sel {String(selectedCount).padStart(2, '0')}
            </span>

            <AnimatePresence>
              {pendingAction && (
                <motion.span
                  key={pendingAction}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
                  style={{ background: 'rgba(111,119,255,0.12)', color: 'var(--color-primary)' }}
                >
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--color-primary)' }}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity }}
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
