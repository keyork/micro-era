'use client';

import { EdgeProps, getBezierPath } from 'reactflow';

interface EdgeData {
  isHybrid?: boolean;
  colorA?: string;
  colorB?: string;
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

  return (
    <>
      <defs>
        {isHybrid && (
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={data?.colorA ?? '#7c6cf0'} />
            <stop offset="100%" stopColor={data?.colorB ?? '#6cf0c8'} />
          </linearGradient>
        )}
      </defs>
      <path
        id={id}
        d={edgePath}
        stroke={isHybrid ? `url(#grad-${id})` : '#3a3850'}
        strokeWidth={isHybrid ? 2 : 1}
        fill="none"
        strokeOpacity={0.6}
        strokeDasharray={isHybrid ? undefined : '4 4'}
      />
    </>
  );
}
