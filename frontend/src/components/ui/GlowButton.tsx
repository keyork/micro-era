'use client';

import { motion } from 'framer-motion';
import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string;
  variant?: 'primary' | 'gold' | 'ghost';
}

const VARIANTS = {
  primary: { bg: 'var(--color-primary)', glow: 'rgba(124,108,240,0.4)' },
  gold: { bg: 'var(--color-gold)', glow: 'rgba(240,200,108,0.4)' },
  ghost: { bg: 'var(--bg-surface)', glow: 'transparent' },
};

export function GlowButton({ children, variant = 'primary', className = '', disabled, ...rest }: Props) {
  const v = VARIANTS[variant];
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 ${className}`}
      style={{
        background: v.bg,
        color: variant === 'ghost' ? 'var(--text-primary)' : variant === 'gold' ? '#0a0a12' : '#fff',
        border: variant === 'ghost' ? '1px solid var(--bg-border)' : 'none',
        boxShadow: disabled ? 'none' : `0 0 20px ${v.glow}`,
      }}
      {...(rest as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}
