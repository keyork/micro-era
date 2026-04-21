'use client';

import { motion } from 'framer-motion';
import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string;
  variant?: 'primary' | 'gold' | 'ghost';
}

const VARIANTS = {
  primary: {
    bg: 'linear-gradient(135deg, #6f77ff, #8b7fff)',
    glow: 'rgba(111, 119, 255, 0.35)',
    glowHover: 'rgba(111, 119, 255, 0.55)',
    color: '#fff',
    border: 'none',
  },
  gold: {
    bg: 'linear-gradient(135deg, #f1c66d, #f0d88a)',
    glow: 'rgba(241, 198, 109, 0.35)',
    glowHover: 'rgba(241, 198, 109, 0.55)',
    color: '#0a0a12',
    border: 'none',
  },
  ghost: {
    bg: 'rgba(16, 21, 34, 0.6)',
    glow: 'transparent',
    glowHover: 'rgba(255, 255, 255, 0.06)',
    color: 'var(--text-primary)',
    border: '1px solid var(--bg-border)',
  },
};

export function GlowButton({ children, variant = 'primary', className = '', disabled, style, ...rest }: Props) {
  const v = VARIANTS[variant];
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.04 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      disabled={disabled}
      className={`group relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      style={{
        background: v.bg,
        color: v.color,
        border: v.border,
        boxShadow: disabled ? 'none' : `0 0 20px ${v.glow}, 0 4px 16px rgba(0,0,0,0.2)`,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 0 28px ${v.glowHover}, 0 0 60px ${v.glow}, 0 4px 20px rgba(0,0,0,0.25)`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = disabled ? 'none' : `0 0 20px ${v.glow}, 0 4px 16px rgba(0,0,0,0.2)`;
      }}
      {...(rest as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}
