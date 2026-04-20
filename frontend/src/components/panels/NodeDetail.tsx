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
  dormant: '这个方向已淘汰——双击节点可把它重新拉回候选池。',
  locked: '这个方向已锁定，并用于生成最终 Brief。',
};

const STATUS_EXTRA_COPY: Record<string, string> = {
  dormant: '只有当你重新觉得它比当前候选更有意思时，才值得复活。',
  locked: '如果你已经锁定它，接下来最重要的是把 Brief 真的落到选题和结构上。',
};

export function NodeDetail({ idea, onClose }: Props) {
  const actionHint =
    STATUS_COPY[idea.status] ??
    '点击其他节点继续比较；底部操作栏会根据你的选择数给出下一步操作。';

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
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="absolute right-4 top-20 z-20 w-80 overflow-y-auto rounded-[28px]"
        style={{
          background: 'rgba(10,14,24,0.90)',
          border: '1px solid rgba(255,255,255,0.09)',
          maxHeight: 'calc(100vh - 130px)',
          boxShadow: '0 24px 90px rgba(0,0,0,0.40)',
          backdropFilter: 'blur(22px)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 pt-5 pb-4"
          style={{
            background: 'rgba(10,14,24,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="space-y-2 min-w-0">
            <MutationBadge type={idea.mutationType} />
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: accentColor }}>
              第 {idea.generation} 代
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
            <section className="space-y-2 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                为什么值得继续
              </p>
              <p className="text-sm leading-6 italic" style={{ color: 'var(--text-secondary)' }}>
                {idea.whyPromising}
              </p>
            </section>
          )}

          {idea.scores && (
            <div className="space-y-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
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
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
              操作提示
            </p>
            <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              {actionHint}
            </p>
            <p className="mt-2 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
              {STATUS_EXTRA_COPY[idea.status] ?? '如果你还拿不准，就先把它和另外一个你最犹豫的方向并排比较。'}
            </p>
          </section>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
