'use client';

import { motion } from 'framer-motion';
import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string;
  variant?: 'primary' | 'gold' | 'ghost';
}

const VARIANTS = {
  primary: {
    bg: 'linear-gradient(135deg, #8890ff 0%, #7c84ff 50%, #5dd8be 100%)',
    glow: 'rgba(136, 144, 255, 0.32)',
    glowHover: 'rgba(136, 144, 255, 0.52)',
    color: '#fff',
    border: 'none',
    shadow: '0 0 22px rgba(136,144,255,0.32), 0 4px 18px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.18)',
    shadowHover: '0 0 36px rgba(136,144,255,0.52), 0 0 70px rgba(93,216,190,0.18), 0 4px 22px rgba(0,0,0,0.30)',
  },
  gold: {
    bg: 'linear-gradient(135deg, #f5cc72 0%, #f7d98a 50%, #f0c05a 100%)',
    glow: 'rgba(245, 204, 114, 0.35)',
    glowHover: 'rgba(245, 204, 114, 0.55)',
    color: '#1a0e00',
    border: 'none',
    shadow: '0 0 22px rgba(245,204,114,0.30), 0 4px 18px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.22)',
    shadowHover: '0 0 36px rgba(245,204,114,0.50), 0 0 70px rgba(245,204,114,0.18), 0 4px 22px rgba(0,0,0,0.28)',
  },
  ghost: {
    bg: 'rgba(8, 12, 24, 0.55)',
    glow: 'transparent',
    glowHover: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--text-secondary)',
    border: '1px solid rgba(255,255,255,0.09)',
    shadow: '0 4px 16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)',
    shadowHover: '0 4px 22px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
};

export function GlowButton({ children, variant = 'primary', className = '', disabled, style, ...rest }: Props) {
  const v = VARIANTS[variant];
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97, y: 0 }}
      disabled={disabled}
      className={`group relative rounded-[14px] px-5 py-2.5 text-sm font-semibold transition-all duration-300 disabled:opacity-25 disabled:cursor-not-allowed ${className}`}
      style={{
        background: v.bg,
        color: v.color,
        border: v.border,
        boxShadow: disabled ? 'none' : v.shadow,
        backdropFilter: variant === 'ghost' ? 'blur(12px)' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = v.shadowHover;
          if (variant === 'ghost') e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = disabled ? 'none' : v.shadow;
        if (variant === 'ghost') e.currentTarget.style.color = v.color;
      }}
      {...(rest as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}
