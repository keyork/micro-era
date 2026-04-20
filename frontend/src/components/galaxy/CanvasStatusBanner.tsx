'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ActivityMessage, ConnectionStatus, PendingAction } from '@/types/idea';

interface Props {
  activity: ActivityMessage | null;
  connectionStatus: ConnectionStatus;
  pendingAction: PendingAction;
  hasBootstrapped: boolean;
  errorMessage: string | null;
}

const toneStyles = {
  neutral: {
    border: 'rgba(255,255,255,0.08)',
    glow: 'rgba(255,255,255,0.08)',
    accent: 'var(--text-secondary)',
  },
  accent: {
    border: 'rgba(111,119,255,0.22)',
    glow: 'rgba(111,119,255,0.22)',
    accent: 'var(--color-primary)',
  },
  success: {
    border: 'rgba(83,198,175,0.22)',
    glow: 'rgba(83,198,175,0.18)',
    accent: 'var(--color-teal)',
  },
  warning: {
    border: 'rgba(241,198,109,0.24)',
    glow: 'rgba(241,198,109,0.18)',
    accent: 'var(--color-gold)',
  },
  error: {
    border: 'rgba(240,108,140,0.24)',
    glow: 'rgba(240,108,140,0.16)',
    accent: 'var(--color-pink)',
  },
};

const pendingCopy: Record<Exclude<PendingAction, null>, string> = {
  bootstrap: '正在同步会话数据',
  big_bang: '正在展开第一代方向',
  evolve: '正在生成下一轮候选',
  hybridize: '正在融合两条方向',
  lock: '正在整理最终 Brief',
  revive: '正在恢复已淘汰分支',
};

function getNextInstruction(pendingAction: PendingAction, connectionStatus: ConnectionStatus) {
  if (connectionStatus !== 'connected') {
    return '接下来：连接完成后，画板会自动出现第一批方向。';
  }

  switch (pendingAction) {
    case 'big_bang':
      return '接下来：先浏览第一批候选，选出最想继续的 1 个方向。';
    case 'evolve':
      return '接下来：等新节点出现后，继续留下最值得推进的方向。';
    case 'hybridize':
      return '接下来：重点看融合结果是不是比原来的两条线更具体、更有冲突。';
    case 'lock':
      return '接下来：Brief 生成完成后，你就可以直接进入写稿或策划。';
    case 'revive':
      return '接下来：把复活的节点和当前保留方向再比较一次。';
    default:
      return '接下来：如果你拿不准，先只保留一个你真的愿意做出来的方向。';
  }
}

export function CanvasStatusBanner({
  activity,
  connectionStatus,
  pendingAction,
  hasBootstrapped,
  errorMessage,
}: Props) {
  const tone = activity?.tone ?? 'neutral';
  const style = toneStyles[tone];
  const showOverlay = !hasBootstrapped || pendingAction === 'bootstrap' || pendingAction === 'big_bang' || pendingAction === 'lock';

  return (
    <>
      <AnimatePresence>
        {activity && (
          <motion.div
            key={activity.timestamp}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="absolute left-1/2 top-5 z-20 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 rounded-[28px] px-5 py-4"
            style={{
              background: 'rgba(10,14,24,0.84)',
              border: `1px solid ${style.border}`,
              boxShadow: `0 20px 70px ${style.glow}`,
              backdropFilter: 'blur(18px)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {activity.title}
                </p>
                <p className="text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                  {activity.detail}
                </p>
                <p className="text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
                  {getNextInstruction(pendingAction, connectionStatus)}
                </p>
              </div>
              <div className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: style.accent }}>
                {pendingAction ? pendingCopy[pendingAction] : connectionStatus}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[rgba(5,8,16,0.5)] px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md rounded-[32px] p-6"
              style={{
                background: 'linear-gradient(180deg, rgba(11,15,25,0.94), rgba(11,15,25,0.8))',
                border: `1px solid ${errorMessage ? 'rgba(240,108,140,0.24)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: '0 30px 120px rgba(0,0,0,0.42)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="mb-5 flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-full"
                  style={{
                    border: `2px solid ${errorMessage ? 'rgba(240,108,140,0.18)' : 'rgba(111,119,255,0.16)'}`,
                    borderTopColor: errorMessage ? 'var(--color-pink)' : 'var(--color-primary)',
                    animation: 'studio-spin 0.9s linear infinite',
                  }}
                />
                <div>
                  <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {errorMessage ? '流程被中断了' : activity?.title ?? '正在准备画板'}
                  </p>
                  <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                    {errorMessage ?? activity?.detail ?? '请稍等，系统正在连接实时演化引擎。'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: '同步会话与已有节点',
                    done: hasBootstrapped,
                    active: pendingAction === 'bootstrap' && !hasBootstrapped,
                  },
                  {
                    title: '连接实时演化引擎',
                    done: connectionStatus === 'connected',
                    active: connectionStatus === 'connecting',
                  },
                  {
                    title: pendingAction === 'lock' ? '整理并生成最终 Brief' : '把结果逐步渲染到画板',
                    done: false,
                    active: pendingAction === 'big_bang' || pendingAction === 'lock',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3"
                    style={{
                      background: item.active ? 'rgba(111,119,255,0.09)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
                      style={{
                        background: item.done
                          ? 'var(--color-teal)'
                          : item.active
                            ? 'var(--color-primary)'
                            : 'rgba(255,255,255,0.08)',
                        color: item.done || item.active ? '#09161a' : 'var(--text-muted)',
                      }}
                    >
                      {item.done ? '✓' : item.active ? '…' : '·'}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
