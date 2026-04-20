'use client';

import { ActivityMessage, ConnectionStatus, EvolutionSession, IdeaNode } from '@/types/idea';
import { MutationBadge } from '@/components/ui/MutationBadge';

interface Props {
  session: EvolutionSession | null;
  selectedCount: number;
  totalNodes: number;
  currentGeneration: number;
  focusedIdea: IdeaNode | null;
  connectionStatus: ConnectionStatus;
  activityLog: ActivityMessage[];
}

function getNextStep(selectedCount: number, focusedIdea: IdeaNode | null) {
  if (focusedIdea?.status === 'dormant') {
    return '这个节点已淘汰，双击可以把它重新拉回候选池。';
  }

  if (selectedCount === 0) {
    return '先点击 1 个你想保留的节点，再决定是继续扩写还是锁定。';
  }

  if (selectedCount === 1) {
    return '你现在可以继续扩写这个方向，或者直接把它锁定成最终 Brief。';
  }

  if (selectedCount === 2) {
    return '现在最适合做“交叉融合”，把两条方向混出新切口。';
  }

  return '当前选择较多，先收窄到 1-2 个节点再继续演化。';
}

function getDecisionHint(selectedCount: number, focusedIdea: IdeaNode | null) {
  if (focusedIdea?.status === 'dormant') {
    return '这个方向如果仍然让你有感觉，就双击复活；否则继续比较当前留下来的分支。';
  }

  if (selectedCount === 0) {
    return '优先选“你愿意真的做出来”的方向，而不是看起来最聪明的方向。';
  }

  if (selectedCount === 1) {
    return '如果你已经能一句话说清它为什么值得做，就可以锁定；否则先扩写一轮。';
  }

  if (selectedCount === 2) {
    return '融合适合两个方向各自成立，但拼在一起可能更有冲突或新鲜感的时候。';
  }

  return '删掉那些“似乎不错，但你其实没有表达冲动”的节点，画板会更清楚。';
}

export function CanvasSidebar({
  session,
  selectedCount,
  totalNodes,
  currentGeneration,
  focusedIdea,
  connectionStatus,
  activityLog,
}: Props) {
  return (
    <aside className="absolute left-4 top-4 z-20 hidden w-[340px] space-y-4 xl:block">
      <section
        className="rounded-[28px] p-5"
        style={{
          background: 'rgba(10,14,24,0.82)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 18px 70px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(18px)',
        }}
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
              background: connectionStatus === 'connected' ? 'rgba(83,198,175,0.14)' : 'rgba(241,198,109,0.12)',
              color: connectionStatus === 'connected' ? 'var(--color-teal)' : 'var(--color-gold)',
            }}
          >
            {connectionStatus === 'connected' ? '实时已连接' : '连接中'}
          </span>
        </div>

        <p className="rounded-2xl px-4 py-3 text-sm leading-6" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
          {session?.seedInput || '正在读取当前会话种子...'}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ['代数', String(currentGeneration)],
            ['节点', String(totalNodes)],
            ['已选', String(selectedCount)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
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
        className="rounded-[28px] p-5"
        style={{
          background: 'rgba(10,14,24,0.74)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(18px)',
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
            { label: '保留 1-2 个最想继续的节点', done: selectedCount > 0 },
            { label: '继续扩写 / 融合 / 锁定', done: currentGeneration > 1 || selectedCount > 0 },
          ].map((step, index) => (
            <div
              key={step.label}
              className="flex items-center gap-3 rounded-2xl px-3 py-3"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{
                  background: step.done ? 'var(--color-teal)' : index === 1 && selectedCount > 0 ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                  color: step.done || (index === 1 && selectedCount > 0) ? '#09161a' : 'var(--text-muted)',
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

        <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
            怎么判断
          </p>
          <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            {getDecisionHint(selectedCount, focusedIdea)}
          </p>
        </div>

        {focusedIdea && (
          <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
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
        className="rounded-[28px] p-5"
        style={{
          background: 'rgba(10,14,24,0.68)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
          Activity Feed
        </p>
        <div className="space-y-3">
          {activityLog.length > 0 ? (
            activityLog.slice(0, 4).map((item) => (
              <div key={item.timestamp} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
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
              连接建立后，最近发生的动作会显示在这里。
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}
