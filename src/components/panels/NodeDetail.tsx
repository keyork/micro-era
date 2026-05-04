'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IdeaNode } from '@/types/idea';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { MutationBadge } from '@/components/ui/MutationBadge';

interface Props {
  idea: IdeaNode;
  onClose: () => void;
}

const STATUS_COPY: Record<string, string> = {
  dormant: '这个方向已被淘汰。双击可以重新拉回来。',
  locked: '这个方向已锁定，Brief 已基于它生成。',
};

const STATUS_EXTRA_COPY: Record<string, string> = {
  dormant: '如果它比当前候选更让你心动，就值得复活。',
  locked: '接下来把 Brief 落到实际选题和结构里。',
};

export function NodeDetail({ idea, onClose }: Props) {
  const actionHint =
    STATUS_COPY[idea.status] ??
    '继续点其他节点比较。底部操作栏会提示下一步。';

  const accentColor =
    idea.status === 'locked'
      ? 'var(--color-gold)'
      : idea.status === 'dormant'
        ? 'var(--text-muted)'
        : 'var(--color-primary)';

  return (
    <AnimatePresence>
      <motion.aside
        key={idea.id}
        initial={{ x: 340, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 340, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="absolute right-4 top-20 z-20 w-80 overflow-y-auto rounded-[26px]"
        style={{
          background: 'rgba(2,4,12,0.92)',
          border: '1px solid rgba(255,255,255,0.07)',
          maxHeight: 'calc(100vh - 130px)',
          boxShadow: '0 32px 100px rgba(0,0,0,0.56), inset 0 1px 0 rgba(180,200,255,0.08)',
          backdropFilter: 'blur(26px)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 pt-4 pb-3"
          style={{
            background: 'rgba(2,4,12,0.96)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="space-y-2 min-w-0">
            <MutationBadge type={idea.mutationType} />
            <p className="text-[10px] uppercase tracking-[0.20em] hud-text" style={{ color: accentColor }}>
              Gen {String(idea.generation).padStart(2, '0')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors"
            style={{
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            aria-label="关闭"
          >
            <span style={{ fontSize: '12px', lineHeight: 1 }}>✕</span>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          <h2 className="text-base font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {idea.title}
          </h2>

          {idea.description && (
            <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              {idea.description}
            </p>
          )}

          {idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {idea.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-xs"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {idea.whyPromising && (
            <section className="space-y-2 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 0 rgba(180,200,255,0.04)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                为什么值得继续
              </p>
              <p className="text-sm leading-6 italic" style={{ color: 'var(--text-secondary)' }}>
                {idea.whyPromising}
              </p>
            </section>
          )}

          {idea.scores && (
            <div className="space-y-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 0 rgba(180,200,255,0.04)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                Critic 评分
              </p>
              <ScoreBar label="新鲜度" value={idea.scores.freshness} color="#6c9ff0" />
              <ScoreBar label="共鸣度" value={idea.scores.resonance} color="#6cf0c8" />
              <ScoreBar label="可执行度" value={idea.scores.feasibility} color="#7c6cf0" />
            </div>
          )}

          <section
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 1px 0 rgba(180,200,255,0.04)' }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              提示
            </p>
            <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              {actionHint}
            </p>
            <p className="mt-2 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
              {STATUS_EXTRA_COPY[idea.status] ?? '拿不准的话，先把它和另一个方向并排比较。'}
            </p>
          </section>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
