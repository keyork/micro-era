'use client';

import { useEvolutionStore } from '@/stores/evolutionStore';
import { GlowButton } from '@/components/ui/GlowButton';

interface Props {
  selectedCount: number;
  onEvolve: () => void;
  onHybridize: () => void;
  onLock: () => void;
}

export function ControlBar({ selectedCount, onEvolve, onHybridize, onLock }: Props) {
  const { isEvolving } = useEvolutionStore();

  const canEvolve = selectedCount >= 1 && !isEvolving;
  const canHybridize = selectedCount === 2 && !isEvolving;
  const canLock = selectedCount === 1 && !isEvolving;

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {isEvolving && (
        <span className="text-sm animate-pulse" style={{ color: 'var(--color-primary)' }}>
          进化中...
        </span>
      )}

      {!isEvolving && selectedCount === 0 && (
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          点击星球选择方向
        </span>
      )}

      {canEvolve && !canHybridize && (
        <GlowButton onClick={onEvolve} variant="primary">
          进化 →
        </GlowButton>
      )}

      {canHybridize && (
        <>
          <GlowButton onClick={onEvolve} variant="primary">
            进化 →
          </GlowButton>
          <GlowButton
            onClick={onHybridize}
            variant="ghost"
            style={{ borderColor: 'var(--color-teal)', color: 'var(--color-teal)' }}
          >
            杂交融合
          </GlowButton>
        </>
      )}

      {canLock && (
        <GlowButton onClick={onLock} variant="gold">
          Lock This Idea
        </GlowButton>
      )}
    </div>
  );
}
