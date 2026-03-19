'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { IdeaNode, MutationType } from '@/types/idea';

const COLOR_MAP: Record<MutationType, string> = {
  seed: '#f0c86c',
  tweak: '#7c6cf0',
  crossover: '#6c9ff0',
  inversion: '#f06c8c',
  random: '#f06c8c',
  hybrid: '#6cf0c8',
};

const SIZE_MAP: Record<string, number> = {
  seed: 70,
  locked: 80,
  selected: 60,
  active: 45,
  dormant: 30,
};

export const IdeaNodeComponent = memo(({ data }: NodeProps<IdeaNode>) => {
  const color = COLOR_MAP[data.mutationType] ?? '#7c6cf0';
  const size = SIZE_MAP[data.status] ?? 45;
  const isDormant = data.status === 'dormant';
  const isRandom = data.mutationType === 'random';
  const isLocked = data.status === 'locked';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: isDormant ? 0.4 : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center cursor-pointer select-none"
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      {/* Glow pulse for random mutation */}
      {isRandom && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: color, opacity: 0.3 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Locked gold pulse */}
      {isLocked && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: '#f0c86c', opacity: 0.4 }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* Main planet */}
      <div
        className="rounded-full flex items-center justify-center text-center overflow-hidden"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}44)`,
          border: `2px solid ${color}`,
          boxShadow: isDormant ? 'none' : `0 0 ${data.brightness * 20}px ${color}88, 0 0 ${data.brightness * 8}px ${color}`,
        }}
      >
        <span
          className="text-white font-medium leading-tight px-1"
          style={{ fontSize: size < 50 ? '6px' : size < 65 ? '8px' : '10px' }}
        >
          {data.title.slice(0, 20)}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </motion.div>
  );
});

IdeaNodeComponent.displayName = 'IdeaNodeComponent';
