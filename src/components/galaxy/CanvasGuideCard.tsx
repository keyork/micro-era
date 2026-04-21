'use client';

import { IdeaNode, PendingAction } from '@/types/idea';

interface Props {
  selectedCount: number;
  currentGeneration: number;
  totalNodes: number;
  pendingAction: PendingAction;
  focusedIdea: IdeaNode | null;
}

function getGuide(selectedCount: number, focusedIdea: IdeaNode | null) {
  if (focusedIdea?.status === 'dormant') {
    return {
      step: '重新比较',
      title: '这个方向已经被淘汰',
      detail: '如果你又觉得它有意思，直接双击节点就能把它拉回候选池。',
      hint: '复活后，再和当前保留的方向一起比较。',
    };
  }

  if (selectedCount === 0) {
    return {
      step: '第 1 步',
      title: '先保留一个你最想继续看的方向',
      detail: '不需要一次选很多。先点 1 个最有感觉的节点，系统就知道该往哪条线继续推。',
      hint: '拿不准时，优先选"你愿意真的做出来"的那个。',
    };
  }

  if (selectedCount === 1) {
    return {
      step: '第 2 步',
      title: '现在可以继续扩写，或者直接锁定',
      detail: '如果这个方向已经够明确，就锁定成 Brief；如果还想多看看，就先扩写一轮。',
      hint: '判断标准很简单：你能不能立刻说出它的核心冲突和切入角度。',
    };
  }

  if (selectedCount === 2) {
    return {
      step: '第 2 步',
      title: '这是最适合做交叉融合的时候',
      detail: '当两个方向各有亮点，但单独看都不够完整时，就把它们混在一起试一次。',
      hint: '融合通常适合"一个有话题性，一个有情绪或人物张力"的组合。',
    };
  }

  return {
    step: '收窄选择',
    title: '先把候选收窄到 1-2 个',
    detail: '选太多时，系统很难给你清晰反馈。先留下最想追的方向，画板会更容易判断。',
    hint: '可以先取消那些"看起来不错，但你并不真想做"的节点。',
  };
}

export function CanvasGuideCard({
  selectedCount,
  currentGeneration,
  totalNodes,
  pendingAction,
  focusedIdea,
}: Props) {
  const guide = getGuide(selectedCount, focusedIdea);
  const stepStates = [
    {
      label: '看第一批方向',
      active: totalNodes > 0 || pendingAction === 'big_bang',
      done: totalNodes > 0,
    },
    {
      label: '保留 1-2 个节点',
      active: selectedCount > 0,
      done: selectedCount > 0,
    },
    {
      label: '扩写 / 融合 / 锁定',
      active: currentGeneration > 1 || pendingAction === 'evolve' || pendingAction === 'hybridize' || pendingAction === 'lock',
      done: currentGeneration > 1,
    },
  ];

  return (
    <section
      className="glass-panel glass-panel--hover absolute left-4 top-20 z-20 w-[min(360px,calc(100vw-1.5rem))] rounded-[28px] p-5 xl:hidden"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-gold)' }}>
            Guide
          </p>
          <p className="mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {guide.title}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ background: 'rgba(111,119,255,0.12)', color: 'var(--color-primary)' }}
        >
          {guide.step}
        </span>
      </div>

      <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
        {guide.detail}
      </p>

      <div className="mt-4 space-y-2">
        {stepStates.map((step) => (
          <div
            key={step.label}
            className="flex items-center gap-3 rounded-2xl px-3 py-3"
            style={{ background: step.active ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)' }}
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300"
              style={{
                background: step.done ? 'var(--color-teal)' : step.active ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                color: step.done || step.active ? '#09161a' : 'var(--text-muted)',
                boxShadow: step.done ? '0 0 10px rgba(83,198,175,0.3)' : step.active ? '0 0 10px rgba(111,119,247,0.3)' : 'none',
              }}
            >
              {step.done ? '✓' : step.active ? '•' : '·'}
            </div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.025)' }}>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
          小建议
        </p>
        <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
          {guide.hint}
        </p>
      </div>
    </section>
  );
}
