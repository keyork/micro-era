'use client';

import { motion } from 'framer-motion';
import { IdeaBrief } from '@/types/idea';
import { GlowButton } from '@/components/ui/GlowButton';
import { useEvolutionStore } from '@/stores/evolutionStore';

interface Props {
  brief: IdeaBrief;
}

export function BriefPanel({ brief }: Props) {
  const { reset } = useEvolutionStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 flex items-center justify-center px-4"
      style={{ background: 'rgba(10,10,18,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        className="w-full max-w-lg rounded-3xl p-8 space-y-6 overflow-y-auto"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-gold)',
          boxShadow: '0 0 60px rgba(240,200,108,0.15)',
          maxHeight: '90vh',
        }}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--color-gold)' }}>
            选题 Brief 已生成
          </p>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            你已锁定方向
          </h2>
        </div>

        {/* Core angle */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            核心角度
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {brief.coreAngle}
          </p>
        </section>

        {/* Target audience */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            目标受众
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{brief.targetAudience}</p>
        </section>

        {/* Outline */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            内容大纲
          </h3>
          <ol className="space-y-2">
            {brief.outlinePoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-bold flex-shrink-0" style={{ color: 'var(--color-gold)' }}>
                  {i + 1}.
                </span>
                {point}
              </li>
            ))}
          </ol>
        </section>

        {/* Evolution path */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            进化路径
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            经过 {brief.evolutionPath.length} 代进化
          </p>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <GlowButton variant="gold" className="flex-1" onClick={() => window.print()}>
            导出 Brief
          </GlowButton>
          <GlowButton variant="ghost" className="flex-1" onClick={reset}>
            重新开始
          </GlowButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
