'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IdeaNode } from '@/types/idea';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { MutationBadge } from '@/components/ui/MutationBadge';

interface Props {
  idea: IdeaNode;
  onClose: () => void;
}

export function NodeDetail({ idea, onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.aside
        key={idea.id}
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute top-4 right-4 w-72 rounded-2xl p-5 space-y-4 overflow-y-auto"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          maxHeight: 'calc(100vh - 120px)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <MutationBadge type={idea.mutationType} />
          <button onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        <h2 className="text-base font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {idea.title}
        </h2>

        {idea.description && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{idea.description}</p>
        )}

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {idea.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: 'var(--bg-border)', color: 'var(--text-secondary)' }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Why promising */}
        {idea.whyPromising && (
          <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
            "{idea.whyPromising}"
          </p>
        )}

        {/* Scores */}
        {idea.scores && (
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--bg-border)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Critic 评分</p>
            <ScoreBar label="新鲜度" value={idea.scores.freshness} color="#6c9ff0" />
            <ScoreBar label="共鸣度" value={idea.scores.resonance} color="#6cf0c8" />
            <ScoreBar label="可执行度" value={idea.scores.feasibility} color="#7c6cf0" />
          </div>
        )}

        {/* Status badge */}
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          第 {idea.generation} 代 · {idea.status === 'dormant' ? '已淘汰（双击复活）' : idea.status}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
