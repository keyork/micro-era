'use client';

import { EdgeProps, getBezierPath } from 'reactflow';

interface EdgeData {
  isHybrid?: boolean;
  color?: string;
  sourceColor?: string;
  targetColor?: string;
}

export function EdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<EdgeData>) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const isHybrid = data?.isHybrid;
  const color = data?.color ?? '#6b74ff';
  const sourceColor = data?.sourceColor ?? color;
  const targetColor = data?.targetColor ?? color;

  return (
    <>
      <defs>
        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          {isHybrid ? (
            <>
              <stop offset="0%" stopColor="#8d8dff" />
              <stop offset="50%" stopColor="#e893bf" />
              <stop offset="100%" stopColor="#71d9c1" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor={sourceColor} stopOpacity="0.18" />
              <stop offset="46%" stopColor={sourceColor} stopOpacity="0.7" />
              <stop offset="100%" stopColor={targetColor} stopOpacity="0.72" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`grad-glow-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          {isHybrid ? (
            <>
              <stop offset="0%" stopColor="#7c6cf0" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#6cf0c8" stopOpacity="0.16" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor={sourceColor} stopOpacity="0.05" />
              <stop offset="100%" stopColor={targetColor} stopOpacity="0.16" />
            </>
          )}
        </linearGradient>
      </defs>

      <path
        d={edgePath}
        stroke={`url(#grad-glow-${id})`}
        strokeWidth={isHybrid ? 10 : 7}
        fill="none"
        strokeOpacity={1}
      />

      <path
        id={id}
        d={edgePath}
        stroke={`url(#grad-${id})`}
        strokeWidth={isHybrid ? 1.8 : 1.2}
        fill="none"
        strokeOpacity={isHybrid ? 0.88 : 0.72}
        strokeDasharray={isHybrid ? undefined : '3 8'}
        strokeLinecap="round"
      />

      <path
        d={edgePath}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={0.7}
        fill="none"
        strokeOpacity={0.45}
        strokeLinecap="round"
      />
    </>
  );
}
