'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { HomeAsyncPanel } from './HomeAsyncPanel';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import type { ContentType } from '@/types/idea';

/* ─── Dynamic imports ─── */

const HomeApiView = dynamic(
  () => import('./HomeApiView').then((mod) => mod.HomeApiView),
  {
    loading: () => (
      <HomeAsyncPanel
        eyebrow="API"
        title="正在装配 API 控制台"
        description="按需加载配置表单，首屏保持轻量。"
      />
    ),
  },
);

const HomeStartView = dynamic(
  () => import('./HomeStartView').then((mod) => mod.HomeStartView),
  {
    loading: () => (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <div className="mx-auto h-6 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="mx-auto h-32 max-w-md rounded-[20px]" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="mx-auto h-20 max-w-sm rounded-[20px]" style={{ background: 'rgba(255,255,255,0.03)' }} />
      </div>
    ),
  },
);

/* ─── Types & Data ─── */

export interface ExampleBubbleData {
  title: string;
  seedInput: string;
  channelDescription: string;
  contentType: ContentType;
}

const TOTAL_SLIDES = 3;
const STEP_LABELS = ['起点', '模型', '想法'];

function seededUnit(seed: number): number {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

function fixedPercent(value: number): string {
  return `${value.toFixed(4)}%`;
}

function fixedPx(value: number): string {
  return `${value.toFixed(5)}px`;
}

function fixedSeconds(value: number): string {
  return `${value.toFixed(4)}s`;
}

/* ─── StarField (3 layers) ─── */

function StarField() {
  const stars = useMemo(() => {
    const layers = [
      { count: 60, size: 1, opacity: 0.3, dur: '120s' },
      { count: 35, size: 1.5, opacity: 0.5, dur: '80s' },
      { count: 15, size: 2, opacity: 0.8, dur: '50s' },
    ];
    return layers.flatMap((layer, li) =>
      Array.from({ length: layer.count }, (_, i) => ({
        id: `s${li}-${i}`,
        x: fixedPercent(seededUnit((li + 1) * 1000 + i * 7) * 100),
        y: fixedPercent(seededUnit((li + 1) * 2000 + i * 11) * 100),
        size: fixedPx(layer.size + seededUnit((li + 1) * 3000 + i * 13) * 0.5),
        glow: fixedPx((layer.size + seededUnit((li + 1) * 3000 + i * 13) * 0.5) * 3),
        opacity: String(layer.opacity),
        twinkleDur: fixedSeconds(3 + seededUnit((li + 1) * 4000 + i * 17) * 4),
        twinkleDelay: fixedSeconds(seededUnit((li + 1) * 5000 + i * 19) * 5),
        driftDur: layer.dur,
        isTwinkle: seededUnit((li + 1) * 6000 + i * 23) > 0.6,
      })),
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            opacity: star.opacity,
            animationName: star.isTwinkle ? 'twinkle' : 'depth-drift-move',
            animationDuration: star.isTwinkle ? star.twinkleDur : star.driftDur,
            animationTimingFunction: 'ease-in-out',
            animationDelay: star.isTwinkle ? star.twinkleDelay : '0s',
            animationIterationCount: 'infinite',
            boxShadow: parseFloat(star.size) > 1.5
              ? `0 0 ${star.glow} rgba(255,255,255,0.3)`
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ─── MouseGlow (cursor-following nebula) ─── */

function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed z-0"
      style={{
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(120,128,255,0.07) 0%, rgba(93,216,190,0.03) 40%, transparent 70%)',
        filter: 'blur(40px)',
        willChange: 'transform',
        left: 0,
        top: 0,
      }}
      aria-hidden="true"
    />
  );
}

/* ─── Shooting Stars ─── */

function ShootingStars() {
  const stars = useMemo(() => [
    { top: '12%', left: '78%', delay: '0s', dur: '4s' },
    { top: '35%', left: '60%', delay: '6s', dur: '5s' },
    { top: '55%', left: '90%', delay: '11s', dur: '4.5s' },
    { top: '22%', left: '45%', delay: '18s', dur: '5.5s' },
  ], []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: s.top,
            left: s.left,
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 0 4px rgba(255,255,255,0.6)',
            animation: `shooting-star ${s.dur} ease-out ${s.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Nebula wash per slide (different color regions of space) ─── */

function NebulaWash({ variant }: { variant: 'seed' | 'input' }) {
  const gradients: Record<string, string> = {
    seed: 'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(120,128,255,0.06), transparent), radial-gradient(ellipse 30% 25% at 20% 70%, rgba(245,204,114,0.03), transparent)',
    input: 'radial-gradient(ellipse 45% 50% at 50% 50%, rgba(120,128,255,0.10), transparent), radial-gradient(ellipse 35% 30% at 70% 30%, rgba(93,216,190,0.04), transparent)',
  };

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: gradients[variant] }}
      aria-hidden="true"
    />
  );
}

/* ─── Flat Halo Disc (NO 3D glossy) ─── */

function FlatHaloDisc({
  size = 120,
  color = '120,128,255',
  pulseDur = '4s',
  glowRadius = 80,
}: {
  size?: number;
  color?: string;
  pulseDur?: string;
  glowRadius?: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer soft glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 2.35,
          height: size * 2.35,
          background: `radial-gradient(circle, rgba(${color},0.15) 0%, rgba(${color},0.055) 42%, transparent 72%)`,
          filter: 'blur(34px)',
          animation: `glow-pulse ${pulseDur} ease-in-out infinite`,
          willChange: 'opacity',
        }}
      />
      {/* Inner glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 1.65,
          height: size * 1.65,
          background: `radial-gradient(circle, rgba(${color},0.24) 0%, rgba(${color},0.075) 48%, transparent 78%)`,
          filter: 'blur(18px)',
          animation: `glow-pulse ${pulseDur} ease-in-out 0.5s infinite`,
          willChange: 'opacity',
        }}
      />
      {/* Core disc — flat, no specular */}
      <div
        className="relative rounded-full"
        style={{
          width: size * 0.055,
          height: size * 0.055,
          background: `rgba(${color},0.18)`,
          boxShadow: `0 0 ${glowRadius * 1.25}px rgba(${color},0.38), 0 0 ${glowRadius * 2.8}px rgba(${color},0.16)`,
          animation: `halo-breathe ${pulseDur} ease-in-out infinite, glow-pulse ${pulseDur} ease-in-out infinite`,
        }}
      />
    </div>
  );
}

/* ─── Settings modal overlay ─── */

function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2, 3, 11, 0.85)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
            data-home-scrollable="true"
          >
            <div
              className="relative rounded-[28px] p-5"
              style={{
                background: 'linear-gradient(180deg, rgba(9,13,24,0.98), rgba(6,10,20,0.95))',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 40px 120px rgba(0,0,0,0.5), 0 0 80px rgba(120,128,255,0.06)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)' }}
                aria-label="关闭设置"
              >
                ✕
              </button>
              <HomeApiView />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── API Status indicator ─── */

function ApiStatusDot() {
  const { isConfigured, isLoaded } = useLLMConfig();
  if (!isLoaded) return null;
  return (
    <div
      className="h-2 w-2 rounded-full"
      style={{
        background: isConfigured ? 'var(--color-teal)' : 'var(--color-gold)',
        boxShadow: isConfigured
          ? '0 0 8px rgba(93,216,190,0.6)'
          : '0 0 8px rgba(245,204,114,0.6)',
      }}
    />
  );
}

/* ─── Gear icon (SVG) ─── */

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M13.1 10a1.2 1.2 0 0 0 .24 1.32l.04.04a1.45 1.45 0 1 1-2.06 2.06l-.04-.04a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.73 1.1v.11a1.45 1.45 0 0 1-2.9 0v-.06a1.2 1.2 0 0 0-.79-1.1 1.2 1.2 0 0 0-1.32.24l-.04.04a1.45 1.45 0 1 1-2.06-2.06l.04-.04a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.73h-.11a1.45 1.45 0 0 1 0-2.9h.06a1.2 1.2 0 0 0 1.1-.79 1.2 1.2 0 0 0-.24-1.32l-.04-.04a1.45 1.45 0 1 1 2.06-2.06l.04.04a1.2 1.2 0 0 0 1.32.24h.06a1.2 1.2 0 0 0 .73-1.1v-.11a1.45 1.45 0 0 1 2.9 0v.06a1.2 1.2 0 0 0 .73 1.1 1.2 1.2 0 0 0 1.32-.24l.04-.04a1.45 1.45 0 1 1 2.06 2.06l-.04.04a1.2 1.2 0 0 0-.24 1.32v.06a1.2 1.2 0 0 0 1.1.73h.11a1.45 1.45 0 0 1 0 2.9h-.06a1.2 1.2 0 0 0-1.1.73z" />
    </svg>
  );
}

/* ─── Dot Indicators ─── */

function DotIndicators({ current, total, onSelect }: { current: number; total: number; onSelect: (i: number) => void }) {
  return (
    <div className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 lg:hidden">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="relative flex items-center justify-center"
          style={{ width: 10, height: 10 }}
          aria-label={`Slide ${i + 1}`}
        >
          <div
            className="rounded-full transition-all duration-500"
            style={{
              width: i === current ? 24 : 6,
              height: 6,
              background: i === current
                ? 'var(--color-primary)'
                : 'rgba(255,255,255,0.2)',
              boxShadow: i === current
                ? '0 0 12px rgba(120,128,255,0.4)'
                : 'none',
              borderRadius: 3,
            }}
          />
        </button>
      ))}
    </div>
  );
}

function StepRail({ current, onSelect }: { current: number; onSelect: (i: number) => void }) {
  return (
    <nav className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 lg:flex" aria-label="首页流程">
      {STEP_LABELS.map((label, i) => {
        const active = i === current;
        const completed = i < current;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(i)}
            className="group flex items-center gap-3 rounded-full py-1.5 pr-3 transition-all duration-300"
            style={{
              color: active ? 'var(--text-primary)' : completed ? 'var(--text-secondary)' : 'var(--text-muted)',
            }}
            aria-current={active ? 'step' : undefined}
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                background: active
                  ? 'rgba(245,204,114,0.14)'
                  : completed
                    ? 'rgba(93,216,190,0.10)'
                    : 'rgba(255,255,255,0.035)',
                border: active
                  ? '1px solid rgba(245,204,114,0.26)'
                  : '1px solid rgba(255,255,255,0.06)',
                boxShadow: active ? '0 0 24px rgba(245,204,114,0.12)' : 'none',
              }}
            >
              {i + 1}
            </span>
            <span className="text-xs font-semibold tracking-[0.12em] opacity-80 transition-opacity group-hover:opacity-100">
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function HomeActionBar({
  current,
  isConfigured,
  onNext,
  onPrev,
  onSelect,
}: {
  current: number;
  isConfigured: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (i: number) => void;
}) {
  const copy = [
    { title: '先连接模型，再开始写想法', action: '连接 LLM', target: 1 },
    { title: isConfigured ? '模型已连接，可以填写想法' : '模型还没接上', action: isConfigured ? '填写想法' : '保存后继续', target: isConfigured ? 2 : 1 },
    { title: '写下种子主题，创建演化会话', action: isConfigured ? '留在这里' : '去配置', target: isConfigured ? 2 : 1 },
  ][current];

  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex w-[min(92vw,720px)] -translate-x-1/2 items-center justify-between gap-3 rounded-full px-3 py-2 sm:px-4"
      style={{
        background: 'rgba(3,5,14,0.82)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 18px 70px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(18px)',
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={current === 0}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition-opacity disabled:opacity-25"
        style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.035)' }}
        aria-label="上一步"
      >
        ←
      </button>

      <div className="min-w-0 flex-1 px-1">
        <p className="truncate text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {copy.title}
        </p>
        <div className="mt-1 h-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((current + 1) / TOTAL_SLIDES) * 100}%`,
              background: 'linear-gradient(90deg, var(--color-gold), var(--color-teal))',
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSelect(copy.target)}
        className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-transform duration-300 hover:-translate-y-0.5 sm:px-5"
        style={{
          color: current === 1 && !isConfigured ? 'var(--color-gold)' : 'var(--color-teal)',
          background: current === 1 && !isConfigured
            ? 'rgba(245,204,114,0.10)'
            : 'rgba(93,216,190,0.10)',
          border: current === 1 && !isConfigured
            ? '1px solid rgba(245,204,114,0.18)'
            : '1px solid rgba(93,216,190,0.18)',
        }}
      >
        {copy.action}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={current === TOTAL_SLIDES - 1}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition-opacity disabled:opacity-25"
        style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.035)' }}
        aria-label="下一步"
      >
        →
      </button>
    </div>
  );
}

/* ─── Arrow navigation hints ─── */

function NavArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  const isLeft = direction === 'left';
  return (
    <button
      onClick={onClick}
      className="fixed top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
      style={{
        [isLeft ? 'left' : 'right']: 16,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        color: 'var(--text-muted)',
      }}
      aria-label={isLeft ? 'Previous slide' : 'Next slide'}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {isLeft
          ? <path d="M9 2L4 7L9 12" />
          : <path d="M5 2L10 7L5 12" />
        }
      </svg>
    </button>
  );
}

/* ═══════════════════════════════════════════
   SLIDE COMPONENTS
   ═══════════════════════════════════════════ */

/* ─── Slide 0: Seed (Landing) ─── */

function SlideSeed({
  onNavigate,
}: {
  onNavigate: (slide: number) => void;
}) {
  return (
    <div className="relative flex h-screen w-screen flex-shrink-0 items-center justify-center px-4">
      <NebulaWash variant="seed" />
      <ShootingStars />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-w-4xl flex-col items-center gap-6 text-center"
      >
        <FlatHaloDisc size={160} color="120,128,255" pulseDur="5s" glowRadius={100} />

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="text-4xl font-semibold tracking-tight sm:text-6xl"
          style={{ color: 'var(--text-primary)' }}
        >
          Micro Era
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-2xl text-sm leading-7 sm:text-base"
          style={{ color: 'var(--text-secondary)' }}
        >
          把一个模糊选题变成可筛选、可融合、可锁定的内容方向。先丢一个念头进去，后面让模型帮你生成第一批分支。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.78 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => onNavigate(1)}
            className="rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, rgba(245,204,114,0.18), rgba(93,216,190,0.14))',
              border: '1px solid rgba(245,204,114,0.20)',
              color: 'var(--color-gold)',
              boxShadow: '0 18px 60px rgba(245,204,114,0.10), 0 0 34px rgba(93,216,190,0.08)',
            }}
          >
            连接 LLM
          </button>
          <button
            type="button"
            onClick={() => onNavigate(2)}
            className="rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'var(--text-secondary)',
            }}
          >
            已有配置，填写想法
          </button>
        </motion.div>
      </motion.div>

      {/* Wordmark */}
      <div
        className="absolute bottom-6 right-6 text-xs tracking-wider"
        style={{ color: 'var(--text-muted)', opacity: 0.5 }}
      >
        Micro Era
      </div>
    </div>
  );
}

/* ─── Slide 1: Input (Seed Form) ─── */

function SlideInput({
  seedIndicator,
  selectedExample,
}: {
  seedIndicator: boolean;
  selectedExample: ExampleBubbleData | null;
}) {
  return (
    <div className="relative flex h-screen w-screen flex-shrink-0 items-center justify-center">
      <NebulaWash variant="input" />

      {/* Small seed indicator top-left */}
      {seedIndicator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute left-6 top-6"
        >
          <FlatHaloDisc size={32} color="120,128,255" pulseDur="3s" glowRadius={20} />
        </motion.div>
      )}

      {/* Form container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl mx-4 sm:mx-auto overflow-y-auto rounded-[28px] p-4 sm:p-6"
        data-home-scrollable="true"
        style={{
          background: 'linear-gradient(180deg, rgba(9,13,24,0.92), rgba(6,10,20,0.85))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.3), 0 0 80px rgba(120,128,255,0.04)',
          backdropFilter: 'blur(16px)',
          maxHeight: '85vh',
        }}
      >
        <HomeStartView selectedExample={selectedExample} />
      </motion.div>
    </div>
  );
}

/* ─── Slide 2: API setup ─── */

function SlideApi() {
  return (
    <div className="relative flex h-screen w-screen flex-shrink-0 items-center justify-center px-4">
      <NebulaWash variant="input" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="grid w-full max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
      >
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-teal)' }}>
              Model Connection
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl" style={{ color: 'var(--text-primary)' }}>
              单独把模型接好
            </h2>
            <p className="mt-4 text-sm leading-7 sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              这里专门填写 LLM API 的 URL、Model Name 和 Key。配置会保存在当前浏览器 localStorage，测试连接也直接从前端发起。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['01', 'Base URL', 'OpenAI 或兼容接口地址'],
              ['02', 'Model Name', '后续演化要调用的模型'],
              ['03', 'API Key', '只保存在浏览器前端'],
            ].map(([index, title, detail]) => (
              <div
                key={title}
                className="rounded-[24px] p-4"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.018)',
                }}
              >
                <p className="text-[11px] font-semibold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                  {index}
                </p>
                <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </p>
                <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="max-h-[86vh] overflow-y-auto rounded-[28px] p-4 sm:p-6"
          data-home-scrollable="true"
          style={{
            background: 'linear-gradient(180deg, rgba(9,13,24,0.94), rgba(6,10,20,0.88))',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 30px 100px rgba(0,0,0,0.32), 0 0 80px rgba(93,216,190,0.04)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <HomeApiView />
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export function HomeExperience() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isConfigured } = useLLMConfig();
  const wheelLockRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const navigateTo = useCallback((slide: number) => {
    setCurrentSlide(Math.max(0, Math.min(TOTAL_SLIDES - 1, slide)));
  }, []);

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  /* Mouse wheel → slide navigation */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (settingsOpen) return;

      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('input, textarea, select, [data-home-scrollable="true"]')) {
        return;
      }

      e.preventDefault();
      if (wheelLockRef.current) return;
      wheelLockRef.current = true;

      if (e.deltaY > 30 || e.deltaX > 30) {
        goNext();
      } else if (e.deltaY < -30 || e.deltaX < -30) {
        goPrev();
      }

      setTimeout(() => {
        wheelLockRef.current = false;
      }, 800);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [goNext, goPrev, settingsOpen]);

  /* Touch → swipe navigation */
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (settingsOpen) return;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (settingsOpen) return;
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goNext();
        else goPrev();
      }
      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goNext, goPrev, settingsOpen]);

  /* Keyboard arrows */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (settingsOpen) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, settingsOpen]);

  return (
    <main className="cosmic-grain relative" style={{ background: 'var(--bg-deep)' }}>
      {/* Global background layers */}
      <StarField />
      <MouseGlow />

      {/* Fixed UI elements */}
      {/* Settings gear — always visible */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="fixed right-5 top-5 z-40 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'var(--text-muted)',
        }}
        aria-label="API 设置"
      >
        <GearIcon />
      </button>

      {/* Navigation arrows */}
      {currentSlide > 0 && <NavArrow direction="left" onClick={goPrev} />}
      {currentSlide < TOTAL_SLIDES - 1 && <NavArrow direction="right" onClick={goNext} />}

      <StepRail current={currentSlide} onSelect={navigateTo} />
      <DotIndicators current={currentSlide} total={TOTAL_SLIDES} onSelect={navigateTo} />
      <HomeActionBar
        current={currentSlide}
        isConfigured={isConfigured}
        onNext={goNext}
        onPrev={goPrev}
        onSelect={navigateTo}
      />

      {/* Slider container */}
      <div className="relative h-screen w-screen overflow-hidden">
        <motion.div
          className="flex h-full"
          animate={{ x: `-${currentSlide * 100}vw` }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 30,
            mass: 0.8,
          }}
          style={{ willChange: 'transform' }}
        >
          {/* Slide 0: Seed */}
          <SlideSeed onNavigate={navigateTo} />

          {/* Slide 1: API */}
          <SlideApi />

          {/* Slide 2: Input */}
          <SlideInput seedIndicator={currentSlide > 1} selectedExample={null} />

        </motion.div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
