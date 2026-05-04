'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { IdeaBrief } from '@/types/idea';
import { GlowButton } from '@/components/ui/GlowButton';
import { useEvolutionStore } from '@/stores/evolutionStore';

interface Props {
  brief: IdeaBrief;
}

function escapeMarkdown(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/#/g, '\\#')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function buildMarkdownDocument(brief: IdeaBrief, pathSteps: string[]): string {
  const outline = brief.outlinePoints
    .map((point, index) => `${index + 1}. ${escapeMarkdown(point)}`)
    .join('\n');
  const path = pathSteps.length > 0
    ? pathSteps.map((step, index) => `${index + 1}. ${escapeMarkdown(step)}`).join('\n')
    : '无';

  return [
    '# Micro Era Brief',
    '',
    `导出时间：${new Date().toLocaleString('zh-CN')}`,
    '',
    '## 核心角度',
    '',
    escapeMarkdown(brief.coreAngle),
    '',
    '## 目标受众',
    '',
    escapeMarkdown(brief.targetAudience),
    '',
    '## 内容大纲',
    '',
    outline || '无',
    '',
    '## 演化路径',
    '',
    path,
    '',
  ].join('\n');
}

function downloadMarkdown(filename: string, markdown: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function BriefPanel({ brief }: Props) {
  const reset = useEvolutionStore((state) => state.reset);
  const nodes = useEvolutionStore((state) => state.nodes);
  const router = useRouter();

  // Resolve node titles from store for the evolution path (IDs → titles)
  const pathSteps = brief.evolutionPath.map((id) => {
    const node = nodes.get(id);
    return node?.title ?? id.slice(0, 8) + '…';
  });

  const handleExportMarkdown = () => {
    const markdown = buildMarkdownDocument(brief, pathSteps);
    downloadMarkdown(`micro-era-brief-${brief.id.slice(0, 8)}.md`, markdown);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="absolute inset-0 z-30 flex items-center justify-center px-4"
      style={{ background: 'rgba(6,9,18,0.88)', backdropFilter: 'blur(16px)' }}
    >
      <motion.div
        className="w-full max-w-2xl overflow-y-auto rounded-[32px]"
        style={{
          background: 'linear-gradient(180deg, rgba(14,18,30,0.98), rgba(10,13,22,0.94))',
          border: '1px solid rgba(241,198,109,0.32)',
          boxShadow: '0 0 0 1px rgba(241,198,109,0.08) inset, 0 36px 140px rgba(0,0,0,0.55)',
          maxHeight: '90vh',
        }}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.08 }}
      >
        {/* Header */}
        <div
          className="px-8 pt-8 pb-6 text-center space-y-1"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: 'var(--color-gold)' }}
          >
            Brief 已生成
          </p>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            方向已锁定
          </h2>
        </div>

        <div className="space-y-5 px-8 py-6">
          <section className="space-y-2">
            <h3
              className="text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: 'var(--text-muted)' }}
            >
              核心角度
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {brief.coreAngle}
            </p>
          </section>

          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3
              className="mb-2 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: 'var(--text-muted)' }}
            >
              目标受众
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {brief.targetAudience}
            </p>
          </div>

          <section className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: 'var(--text-muted)' }}
            >
              内容大纲
            </h3>
            <ol className="space-y-2">
              {brief.outlinePoints.map((point, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span
                    className="font-bold flex-shrink-0"
                    style={{ color: 'var(--color-gold)' }}
                  >
                    {i + 1}.
                  </span>
                  {point}
                </li>
              ))}
            </ol>
          </section>

          {pathSteps.length > 0 && (
            <section className="space-y-3">
              <div>
                <h3
                  className="text-xs font-semibold uppercase tracking-[0.22em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  演化路径
                </h3>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  经过 {pathSteps.length} 个节点收敛至此
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {pathSteps.map((title, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span
                      className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{ background: 'rgba(241,198,109,0.18)', color: 'var(--color-gold)' }}
                    >
                      {index + 1}
                    </span>
                    {title}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="flex gap-3 pt-2">
            <GlowButton variant="gold" className="flex-1" onClick={handleExportMarkdown}>
              导出 Markdown
            </GlowButton>
            <GlowButton
              variant="ghost"
              className="flex-1"
              onClick={() => {
                reset();
                router.push('/');
              }}
            >
              重新开始
            </GlowButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
