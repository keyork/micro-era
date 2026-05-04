'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { IdeaNode, MutationType } from '@/types/idea';

export const MUTATION_COLORS: Record<MutationType, string> = {
  seed:      '#f5cc72',
  tweak:     '#8890ff',
  crossover: '#7cacf0',
  inversion: '#f06c8c',
  random:    '#f06c8c',
  hybrid:    '#5dd8be',
};

const MUTATION_ICONS: Record<MutationType, string> = {
  seed:      '✦',
  tweak:     '◈',
  crossover: '⊕',
  inversion: '↺',
  random:    '⚡',
  hybrid:    '⊗',
};

const STATUS_SIZE: Record<string, number> = {
  locked:   102,
  selected:  96,
  active:    58,
  dormant:   44,
};

const NODE_BOX_WIDTH = 244;
const NODE_BOX_HEIGHT = 188;
const NODE_CENTER_Y = 76;

export const IdeaNodeComponent = memo(({ data }: NodeProps<IdeaNode>) => {
  const color = MUTATION_COLORS[data.mutationType] ?? '#8890ff';
  const icon  = MUTATION_ICONS[data.mutationType] ?? '◈';
  const isSeed    = data.mutationType === 'seed';
  const isDormant = data.status === 'dormant';
  const isLocked  = data.status === 'locked';
  const isSelected = data.status === 'selected';
  const isHybrid  = data.mutationType === 'hybrid';
  const shouldAnimate = isSelected || isLocked;

  const baseSize = STATUS_SIZE[data.status] ?? 64;
  const size = isSeed ? Math.max(baseSize, 108) : baseSize;
  const gW   = size * (isHybrid ? 1.62 : 1.5);
  const gH   = size * (isHybrid ? 1.04 : 0.88);
  const coreSize = size * (isLocked ? 0.35 : 0.31);

  /* Animation speeds */
  const orbitDur     = isSeed ? '34s' : isHybrid ? '26s' : '30s';
  const breatheDur   = isSeed ? '5s'  : isSelected ? '3s' : '7s';
  const haloPeak     = isDormant ? '0.12' : isSelected ? '0.72' : isLocked ? '0.52' : '0.32';
  const haloBase     = isDormant ? '0.07' : isSelected ? '0.35' : isLocked ? '0.26' : '0.16';

  return (
    <div
      style={{ width: NODE_BOX_WIDTH, height: NODE_BOX_HEIGHT }}
      className="relative cursor-grab select-none active:cursor-grabbing"
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      <div
        className="absolute left-1/2"
        style={{
          top: NODE_CENTER_Y,
          width: gW,
          height: gH,
          transform: 'translate(-50%, -50%)',
        }}
      >

        {/* ── Outer halo (breathes) ── */}
        <div
          className="absolute"
          style={{
            inset: -size * 0.18,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}44 0%, ${color}11 55%, transparent 100%)`,
            filter: 'blur(26px)',
            animation: shouldAnimate ? `halo-breathe ${breatheDur} ease-in-out infinite` : 'none',
            '--h-base': haloBase,
            '--h-peak': haloPeak,
            opacity: parseFloat(haloBase),
          } as React.CSSProperties}
        />

        {/* ── Selection pulse ring ── */}
        {isSelected && (
          <div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width:  gW + 50,
              height: gH + 36,
              transform: 'translate(-50%, -50%)',
              border: `1px solid ${color}44`,
              boxShadow: `0 0 36px ${color}22, inset 0 0 36px ${color}11`,
              animation: 'pulse-ring 2.4s ease-in-out infinite',
            }}
          />
        )}

        {/* ── Secondary outer ring ── */}
        {(isSelected || isLocked) && (
          <div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width:  gW + 22,
              height: gH + 14,
              transform: 'translate(-50%, -50%)',
              border: `1px solid ${isLocked ? '#f5cc7228' : `${color}22`}`,
              boxShadow: `0 0 18px ${color}18`,
            }}
          />
        )}

        {/* ── Rotating orbital bands ── */}
        <div
          className="absolute inset-0"
          style={{
            animation: shouldAnimate ? `orbit-spin ${orbitDur} linear infinite` : 'none',
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width:  gW * 0.97,
              height: gH * 0.42,
              transform: 'translate(-50%, -50%) rotate(24deg)',
              background: `linear-gradient(90deg,
                transparent 0%,
                ${color}${isDormant ? '1a' : '5a'} 18%,
                ${color}${isDormant ? '22' : '96'} 50%,
                ${color}${isDormant ? '1a' : '5a'} 82%,
                transparent 100%
              )`,
              filter: 'blur(8px)',
              opacity: isDormant ? 0.28 : isSelected ? 1 : 0.7,
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width:  gW * 0.82,
              height: gH * 0.28,
              transform: 'translate(-50%, -50%) rotate(-22deg)',
              background: `linear-gradient(90deg,
                transparent 0%,
                ${color}${isDormant ? '12' : '3a'} 16%,
                ${color}${isDormant ? '18' : '68'} 50%,
                ${color}${isDormant ? '12' : '3a'} 84%,
                transparent 100%
              )`,
              filter: 'blur(10px)',
              opacity: isDormant ? 0.22 : isSelected ? 0.9 : 0.52,
            }}
          />
        </div>

        {/* ── Core (the star) ── */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width:  coreSize,
            height: coreSize,
            transform: 'translate(-50%, -50%)',
            background: isDormant
              ? `radial-gradient(circle, rgba(255,255,255,0.35) 0%, ${color}55 46%, transparent 100%)`
              : isLocked
                ? 'radial-gradient(circle, #fff8e0 0%, #f5cc72 38%, rgba(245,204,114,0.08) 100%)'
                : `radial-gradient(circle, #ffffff 0%, ${color} 40%, rgba(255,255,255,0.04) 100%)`,
            boxShadow: isDormant
              ? 'none'
              : isSelected
                ? `0 0 22px ${color}, 0 0 50px ${color}88, 0 0 80px ${color}33`
                : isLocked
                  ? `0 0 18px #f5cc72, 0 0 44px #f5cc7266`
                  : `0 0 14px ${color}, 0 0 28px ${color}55`,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{
              color: isDormant ? 'rgba(200,210,230,0.5)' : '#f8fbff',
              fontSize: size < 62 ? 10 : 12,
              textShadow: '0 0 8px rgba(255,255,255,0.4)',
            }}
          >
            {icon}
          </div>
        </div>

        {/* ── Orbiting sparkle dots ── */}
        {shouldAnimate && (
          <div
            className="absolute inset-0"
            style={{
              animation: `orbit-spin ${orbitDur} linear infinite`,
              animationDirection: 'reverse',
            }}
          >
            {[0, 120, 240].map((angleDeg, idx) => {
              const rad = (angleDeg * Math.PI) / 180;
              const rx  = gW * 0.44;
              const ry  = gH * 0.38;
              const cx  = gW / 2 + rx * Math.cos(rad) - (2 + idx * 0.5);
              const cy  = gH / 2 + ry * Math.sin(rad) - (2 + idx * 0.5);
              return (
                <div
                  key={idx}
                  className="absolute rounded-full"
                  style={{
                    width:  3 + idx * 0.5,
                    height: 3 + idx * 0.5,
                    left:   cx,
                    top:    cy,
                    background: 'rgba(255,255,255,0.88)',
                    boxShadow: `0 0 7px ${color}77`,
                    opacity: 0.65 - idx * 0.1,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* ── Lock badge ── */}
        {isLocked && (
          <div
            className="absolute flex items-center justify-center rounded-full"
            style={{
              width:  22,
              height: 22,
              top:    -2,
              right:  8,
              background: 'radial-gradient(circle, #fff5d0, #f5cc72)',
              boxShadow: '0 0 12px rgba(245,204,114,0.7), 0 0 28px rgba(245,204,114,0.3)',
            }}
          >
            <span style={{ fontSize: '9px', color: '#3a2800', lineHeight: 1 }}>✦</span>
          </div>
        )}

        {/* ── Selected label ── */}
        {isSelected && (
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.18em]"
            style={{
              background: `${color}1e`,
              color: '#f0f4ff',
              border: `1px solid ${color}28`,
              boxShadow: `0 0 18px ${color}22`,
              whiteSpace: 'nowrap',
            }}
          >
            已选中
          </div>
        )}
      </div>

      {/* ── Title label ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[10px] font-medium"
        style={{
          top: NODE_CENTER_Y + Math.max(gH / 2, 34) + 18,
          maxWidth: 180,
          background: isSelected
            ? 'rgba(8, 14, 30, 0.96)'
            : isDormant
              ? 'rgba(4, 6, 14, 0.55)'
              : 'rgba(5, 8, 18, 0.76)',
          color: isDormant
            ? 'var(--text-muted)'
            : isSelected
              ? '#e8eeff'
              : 'var(--text-secondary)',
          border: isSelected
            ? `1px solid ${color}22`
            : '1px solid rgba(255,255,255,0.04)',
          boxShadow: isSelected
            ? `0 0 24px ${color}18`
            : '0 4px 16px rgba(0,0,0,0.24)',
          backdropFilter: 'blur(12px)',
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
