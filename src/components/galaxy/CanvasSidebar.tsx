'use client';

import { ActivityMessage, EvolutionSession, IdeaNode } from '@/types/idea';
import { MutationBadge } from '@/components/ui/MutationBadge';

interface Props {
  session: EvolutionSession | null;
  selectedCount: number;
  totalNodes: number;
  currentGeneration: number;
  focusedIdea: IdeaNode | null;
  activityLog: ActivityMessage[];
}

function getNextStep(selectedCount: number, focusedIdea: IdeaNode | null) {
  if (focusedIdea?.status === 'dormant') {
    return '已淘汰。双击可以重新拉回来。';
  }

  if (selectedCount === 0) {
    return '先点 1 个想保留的节点，再决定扩写还是锁定。';
  }

  if (selectedCount === 1) {
    return '可以继续扩写，也可以直接锁定成 Brief。';
  }

  if (selectedCount === 2) {
    return '现在适合做交叉融合，把两条方向混出新切口。';
  }

    return '选择有点多，先收窄到 1-2 个再继续。';
}

function getDecisionHint(selectedCount: number, focusedIdea: IdeaNode | null) {
  if (focusedIdea?.status === 'dormant') {
    return '如果仍然让你心动，就双击复活。否则继续比较剩下的。';
  }

  if (selectedCount === 0) {
    return '优先选你真的愿意做出来的，而不是看起来最聪明的。';
  }

  if (selectedCount === 1) {
    return '能一句话说清为什么值得做，就锁定。说不清就先扩写一轮。';
  }

  if (selectedCount === 2) {
    return '融合适合两个各自成立的方向——拼在一起可能更有冲突或新鲜感。';
  }

    return '去掉那些"似乎不错但你不真想做"的节点，画板会更清晰。';
}

export function CanvasSidebar({
  session,
  selectedCount,
  totalNodes,
  currentGeneration,
  focusedIdea,
  activityLog,
}: Props) {
  return (
    <aside className="absolute left-4 top-4 z-20 hidden w-[340px] space-y-4 xl:block">
      <section
        className="glass-panel glass-panel--hover rounded-[28px] p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-gold)' }}>
              Session
            </p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              当前演化任务
            </h2>
          </div>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{
              background: 'rgba(83,198,175,0.12)',
              color: 'var(--color-teal)',
            }}
          >
            本地运行
          </span>
        </div>

        <p className="rounded-2xl px-4 py-3 text-sm leading-6" style={{ background: 'rgba(255,255,255,0.025)', color: 'var(--text-secondary)' }}>
          {session?.seedInput || '读取中...'}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ['代数', String(currentGeneration)],
            ['节点', String(totalNodes)],
            ['已选', String(selectedCount)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.025)' }}>
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="glass-panel glass-panel--hover rounded-[28px] p-5"
        style={{
          background: 'rgba(10,14,24,0.72)',
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          Next Move
        </p>
        <p className="text-base font-semibold leading-7" style={{ color: 'var(--text-primary)' }}>
          {getNextStep(selectedCount, focusedIdea)}
        </p>

        <div className="mt-4 space-y-2">
          {[
            { label: '先看第一批方向', done: totalNodes > 0 },
            { label: '保留 1-2 个最想继续的', done: selectedCount > 0 },
            { label: '继续扩写 / 融合 / 锁定', done: currentGeneration > 1 || selectedCount > 0 },
          ].map((step, index) => (
            <div
              key={step.label}
              className="flex items-center gap-3 rounded-2xl px-3 py-3"
              style={{ background: 'rgba(255,255,255,0.025)' }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300"
                style={{
                  background: step.done ? 'var(--color-teal)' : index === 1 && selectedCount > 0 ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                  color: step.done || (index === 1 && selectedCount > 0) ? '#09161a' : 'var(--text-muted)',
                  boxShadow: step.done ? '0 0 10px rgba(83,198,175,0.3)' : 'none',
                }}
              >
                {step.done ? '✓' : index + 1}
              </div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)' }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
            怎么判断
          </p>
          <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            {getDecisionHint(selectedCount, focusedIdea)}
          </p>
        </div>

        {focusedIdea && (
          <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)' }}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <MutationBadge type={focusedIdea.mutationType} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                第 {focusedIdea.generation} 代
              </span>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {focusedIdea.title}
            </p>
            {focusedIdea.description && (
              <p className="mt-2 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                {focusedIdea.description}
              </p>
            )}
          </div>
        )}
      </section>

      <section
        className="glass-panel glass-panel--hover rounded-[28px] p-5"
        style={{
          background: 'rgba(10,14,24,0.66)',
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          Activity Feed
        </p>
        <div className="space-y-3">
          {activityLog.length > 0 ? (
            activityLog.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.025)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </p>
                <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                  {item.detail}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              操作记录会出现在这里。
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}
