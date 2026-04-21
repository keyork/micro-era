'use client';

import { motion } from 'framer-motion';

interface Props {
  label: string;
  value: number;
  color?: string;
}

export function ScoreBar({ label, value, color = '#7c6cf0' }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
