'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { IdeaNode, MutationType } from '@/types/idea';

export const MUTATION_COLORS: Record<MutationType, string> = {
  seed: '#f0c86c',
  tweak: '#7c6cf0',
  crossover: '#6c9ff0',
  inversion: '#f06c8c',
  random: '#f06c8c',
  hybrid: '#6cf0c8',
};

const MUTATION_ICONS: Record<MutationType, string> = {
  seed: '✦',
  tweak: '◈',
  crossover: '⊕',
  inversion: '↺',
  random: '⚡',
  hybrid: '⊗',
};

const STATUS_SIZE: Record<string, number> = {
  locked: 98,
  selected: 80,
  active: 62,
  dormant: 44,
};

export const IdeaNodeComponent = memo(({ data }: NodeProps<IdeaNode>) => {
  const color = MUTATION_COLORS[data.mutationType] ?? '#7c6cf0';
  const icon = MUTATION_ICONS[data.mutationType] ?? '◈';
  const isSeed = data.mutationType === 'seed';
  const isDormant = data.status === 'dormant';
  const isLocked = data.status === 'locked';
  const isSelected = data.status === 'selected';
  const isHybrid = data.mutationType === 'hybrid';

  const baseSize = STATUS_SIZE[data.status] ?? 62;
  const size = isSeed ? Math.max(baseSize, 104) : baseSize;
  const galaxyWidth = size * (isHybrid ? 1.6 : 1.48);
  const galaxyHeight = size * (isHybrid ? 1.02 : 0.86);
  const coreSize = size * (isLocked ? 0.34 : 0.3);
  const haloOpacity = isDormant ? 0.18 : isSelected ? 0.42 : isLocked ? 0.4 : 0.28;

  return (
    <div
      style={{ width: Math.max(galaxyWidth + 64, 156), height: galaxyHeight + 78 }}
      className="relative flex cursor-grab select-none items-start justify-center active:cursor-grabbing"
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      <div className="relative" style={{ width: galaxyWidth, height: galaxyHeight }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}55 0%, ${color}0e 56%, transparent 100%)`,
            filter: 'blur(22px)',
            opacity: haloOpacity,
          }}
        />

        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: galaxyWidth + 10,
            height: galaxyHeight + 8,
            border: `1px solid ${isDormant ? `${color}1a` : `${color}26`}`,
            boxShadow: isSelected ? `0 0 18px ${color}20` : 'none',
          }}
        />

        {(isSelected || isLocked || isSeed) && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: galaxyWidth + 26,
              height: galaxyHeight + 18,
              border: `1px dashed ${isLocked ? '#f0c86c55' : `${color}30`}`,
              opacity: 0.9,
            }}
          />
        )}

        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: galaxyWidth * 0.96,
            height: galaxyHeight * 0.4,
            transform: 'translate(-50%, -50%) rotate(24deg)',
            background: `linear-gradient(90deg, transparent 0%, ${color}${isDormant ? '20' : '6e'} 22%, ${color}${isDormant ? '26' : 'a8'} 50%, ${color}${isDormant ? '20' : '6e'} 78%, transparent 100%)`,
            filter: 'blur(9px)',
            opacity: isDormant ? 0.32 : 0.88,
          }}
        />

        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: galaxyWidth * 0.84,
            height: galaxyHeight * 0.28,
            transform: 'translate(-50%, -50%) rotate(-22deg)',
            background: `linear-gradient(90deg, transparent 0%, ${color}${isDormant ? '16' : '48'} 18%, ${color}${isDormant ? '1d' : '7a'} 50%, ${color}${isDormant ? '16' : '48'} 82%, transparent 100%)`,
            filter: 'blur(10px)',
            opacity: isDormant ? 0.26 : 0.72,
          }}
        />

        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: coreSize,
            height: coreSize,
            transform: 'translate(-50%, -50%)',
            background: isDormant
              ? `radial-gradient(circle, rgba(255,255,255,0.42) 0%, ${color}66 46%, transparent 100%)`
              : isLocked
                ? 'radial-gradient(circle, #fff4cc 0%, #f0c86c 42%, rgba(240,200,108,0.1) 100%)'
                : `radial-gradient(circle, #ffffff 0%, ${color} 42%, rgba(255,255,255,0.06) 100%)`,
            boxShadow: isDormant ? 'none' : `0 0 14px ${color}, 0 0 28px ${color}66`,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{
              color: '#f7fbff',
              fontSize: size < 60 ? 10 : 12,
              textShadow: '0 0 10px rgba(255,255,255,0.32)',
            }}
          >
            {icon}
          </div>
        </div>

        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="absolute rounded-full"
            style={{
              width: 3 + index,
              height: 3 + index,
              left: `${28 + index * 20}%`,
              top: `${34 + (index % 2) * 18}%`,
              background: 'rgba(255,255,255,0.84)',
              boxShadow: `0 0 8px ${color}66`,
              opacity: isDormant ? 0.24 : 0.66 - index * 0.1,
            }}
          />
        ))}

        {isLocked && (
          <div
            className="absolute flex items-center justify-center rounded-full"
            style={{
              width: 20,
              height: 20,
              top: 0,
              right: 10,
              background: '#f0c86c',
              boxShadow: '0 0 10px rgba(240,200,108,0.6)',
            }}
          >
            <span style={{ fontSize: '9px', color: '#0a0a12', lineHeight: 1 }}>✦</span>
          </div>
        )}
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[10px] font-medium"
        style={{
          top: galaxyHeight + 16,
          maxWidth: 170,
          background: 'rgba(5,10,20,0.76)',
          border: `1px solid ${isSelected ? `${color}48` : 'rgba(255,255,255,0.08)'}`,
          color: isDormant ? 'var(--text-muted)' : 'var(--text-primary)',
          boxShadow: isSelected ? `0 0 16px ${color}16` : 'none',
          backdropFilter: 'blur(10px)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.title}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
});

IdeaNodeComponent.displayName = 'IdeaNodeComponent';
