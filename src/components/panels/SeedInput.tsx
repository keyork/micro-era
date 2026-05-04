'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { ContentType } from '@/types/idea';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import type { ExampleBubbleData } from '@/components/home/HomeExperience';

const contentTypes: { value: ContentType; label: string; hint: string; icon: string }[] = [
  { value: 'video', label: '视频', hint: '适合冲突感、镜头感和情绪推进', icon: '▶' },
  { value: 'article', label: '文章', hint: '适合观点展开、逻辑递进和论证', icon: '¶' },
  { value: 'podcast', label: '播客', hint: '适合聊天感、陪伴感和延展讨论', icon: '◉' },
  { value: 'newsletter', label: 'Newsletter', hint: '适合稳定连载和持续更新主题', icon: '✉' },
];

const submitStages = [
  {
    title: '创建会话',
    detail: '保存种子主题、内容类型与频道方向。',
  },
  {
    title: '准备画板',
    detail: '连接演化引擎，接收第一批方向节点。',
  },
  {
    title: '进入演化',
    detail: '等待变成可见反馈，而不是空白跳转。',
  },
];

export function SeedInput({ selectedExample }: { selectedExample?: ExampleBubbleData | null }) {
  const router = useRouter();
  const [seedInput, setSeedInput] = useState('');
  const [contentType, setContentType] = useState<ContentType>('video');
  const [channelDescription, setChannelDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [error, setError] = useState('');
  const { isConfigured, isLoaded } = useLLMConfig();

  const canSubmit = seedInput.trim().length > 8;
  const currentTip = !seedInput.trim()
    ? '写一个你最近反复想到、但还没想清楚的主题。'
    : seedInput.trim().length < 18
      ? '再补一点情绪、矛盾或你的观察，分支会更有意思。'
      : '这个输入已经够用了，进入画板后会先帮你展开第一代方向。';

  useEffect(() => {
    if (!selectedExample) return;

    setSeedInput(selectedExample.seedInput);
    setChannelDescription(selectedExample.channelDescription);
    setContentType(selectedExample.contentType);
    setError('');
  }, [selectedExample]);

  useEffect(() => {
    if (!isLoading) {
      setActiveStage(0);
      return;
    }

    const timers = [0, 900, 1800].map((delay, index) =>
      window.setTimeout(() => {
        setActiveStage(index);
      }, delay),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedInput.trim()) return;

    setIsLoading(true);
    setError('');
    try {
      const session = api.createSession({
        seedInput: seedInput.trim(),
        contentType,
        channelDescription: channelDescription.trim() || undefined,
      });
      router.push(`/evolve/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建会话失败，请重试');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-gold)' }}>
          Start With One Seed
        </p>
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          先说出你现在最想做的选题
        </h2>
        <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
          这里不是提交成品，而是帮你把起点说清楚。主题越具体，情绪和冲突越明确，后面的分支质量越高。
        </p>
      </div>

      <div
        className="mb-6 rounded-[24px] p-4"
        style={{
          background: 'linear-gradient(180deg, rgba(83,198,175,0.08), rgba(255,255,255,0.02))',
          boxShadow: '0 18px 60px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.012)',
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--color-teal)' }}>
              推荐写法
            </p>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-primary)' }}>
              这个句式效果最好:
            </p>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              我想做一个关于「主题」的内容，但不想只讲「常规角度」，我更想抓住「情绪 / 矛盾 / 新观察」。
            </p>
          </div>

          <div className="grid gap-2 sm:min-w-[220px]">
            {[
              ['种子', '写主题和矛盾'],
              ['形态', '选更适合的表达方式'],
              ['画板', '进入后只保留 1-2 个方向'],
            ].map(([title, description], index) => (
              <div
                key={title}
                className="rounded-2xl px-4 py-3"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.012)',
                }}
              >
                <p className="mb-1 text-xs font-semibold tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                  0{index + 1}
                </p>
                <p className="mb-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </p>
                <p className="text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            你的想法种子
          </label>
          <textarea
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            placeholder="例如：我想做一期关于 AI 焦虑的视频，但不想只讲工具和效率，更想讲人在被技术推动时的心理失衡。"
            rows={5}
            className="cosmic-input w-full rounded-[24px] px-4 py-4 text-base resize-none"
          />
          <p className="mt-2 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
            写「主题 + 你想抓住的情绪 / 冲突 / 观察」，比只写一个宽泛关键词更有用。
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs leading-5" style={{ color: 'var(--color-teal)' }}>
              {currentTip}
            </p>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                background: canSubmit ? 'rgba(83,198,175,0.12)' : 'rgba(255,255,255,0.04)',
                color: canSubmit ? 'var(--color-teal)' : 'var(--text-muted)',
              }}
            >
              {seedInput.trim().length} 字
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            内容类型
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {contentTypes.map((ct) => {
              const isActive = contentType === ct.value;
              return (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setContentType(ct.value)}
                  className="rounded-[20px] px-4 py-4 text-left transition-all duration-300"
                  style={{
                    background: isActive
                      ? 'linear-gradient(180deg, rgba(111,119,255,0.26), rgba(83,198,175,0.12))'
                      : 'rgba(255,255,255,0.02)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: isActive
                      ? '0 22px 56px rgba(111,119,255,0.2), 0 0 36px rgba(83,198,175,0.08), inset 0 0 0 1px rgba(255,255,255,0.03)'
                      : '0 8px 28px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.012)',
                    transform: isActive ? 'translateY(-4px) scale(1.015)' : 'scale(0.965)',
                    opacity: isActive ? 1 : 0.55,
                    filter: isActive ? 'saturate(1.05)' : 'saturate(0.72)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: isActive ? '0 0 18px rgba(111,119,255,0.22)' : 'none',
                      }}
                    >
                      {ct.icon}
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em]"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {isActive ? '已选' : '未选'}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {ct.label}
                  </p>
                  <p className="mt-1 text-xs leading-5" style={{ color: isActive ? 'rgba(237,242,255,0.82)' : 'var(--text-muted)' }}>
                    {ct.hint}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
            选中项会直接影响后续分支的表达方式和节奏。
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            频道方向 <span style={{ color: 'var(--text-muted)' }}>(可选)</span>
          </label>
          <input
            type="text"
            value={channelDescription}
            onChange={(e) => setChannelDescription(e.target.value)}
            placeholder="一句话描述你的长期创作方向，例如：科技与人文交叉处的心理变化。"
            className="cosmic-input w-full rounded-[24px] px-4 py-3 text-base"
          />
        </div>

        {error && (
          <p
            className="rounded-2xl px-4 py-3 text-sm"
            style={{
              color: 'var(--color-pink)',
              background: 'rgba(240,108,140,0.06)',
              boxShadow: 'inset 0 0 0 1px rgba(240,108,140,0.03)',
            }}
          >
            {error}
          </p>
        )}

        {!isConfigured && (
          <div
            className="rounded-[24px] p-4"
            style={{
              background: 'rgba(241,198,109,0.06)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.14), inset 0 0 0 1px rgba(241,198,109,0.025)',
            }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--color-gold)' }}>
              还没有配置 API Key
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              演化画板需要调用 LLM，请在独立的 API 配置页或右上角设置里填写并测试。
            </p>
          </div>
        )}

        {isLoading && (
          <div
            className="space-y-3 rounded-[24px] p-4"
            style={{
              background: 'linear-gradient(180deg, rgba(111,125,247,0.10), rgba(255,255,255,0.02))',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.018)',
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  正在准备画板
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  创建会话后自动进入演化画板。
                </p>
              </div>
              <div
                className="h-10 w-10 rounded-full"
                style={{
                  background:
                    'conic-gradient(from 180deg, rgba(111,119,247,0.08), var(--color-primary), rgba(83,198,175,0.46), rgba(111,119,247,0.08))',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
                  animation: 'studio-spin 0.9s linear infinite',
                }}
              />
            </div>

            <div className="space-y-2">
              {submitStages.map((stage, index) => {
                const isActive = index === activeStage;
                const isDone = index < activeStage;

                return (
                  <div
                    key={stage.title}
                    className="flex items-start gap-3 rounded-2xl px-3 py-3 transition-all duration-300"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                      boxShadow: isActive ? 'inset 0 0 0 1px rgba(255,255,255,0.018)' : 'none',
                    }}
                  >
                    <div
                      className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300"
                      style={{
                        background: isDone ? 'var(--color-teal)' : isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                        color: isDone || isActive ? '#08121a' : 'var(--text-muted)',
                        boxShadow: isActive ? '0 0 12px rgba(111,119,247,0.3)' : 'none',
                      }}
                    >
                      {isDone ? '✓' : index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {stage.title}
                      </p>
                      <p className="text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                        {stage.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <motion.button
          type="submit"
          disabled={!canSubmit || isLoading || !isConfigured || !isLoaded}
          whileHover={!canSubmit || isLoading || !isConfigured || !isLoaded ? {} : { scale: 1.02 }}
          whileTap={!canSubmit || isLoading || !isConfigured || !isLoaded ? {} : { scale: 0.98 }}
          className="w-full rounded-[24px] py-4 text-base font-semibold transition-all duration-300 disabled:opacity-30"
          style={{
            background: 'linear-gradient(135deg, #6f77ff 0%, #8b7fff 40%, #53c6af 100%)',
            color: '#fff',
            boxShadow: '0 18px 60px rgba(83,198,175,0.18), 0 0 40px rgba(111,119,255,0.12)',
          }}
        >
          {isLoading ? '正在创建...' : '开始演化'}
        </motion.button>

        {!isLoading && (
          <div
            className="rounded-[24px] p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              boxShadow: '0 18px 50px rgba(0,0,0,0.16), inset 0 0 0 1px rgba(255,255,255,0.012)',
            }}
          >
            <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              进入画板后
            </p>
            <div className="space-y-2 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
              <p>1. 第一批候选方向自动展开，不用盯着空白页等。</p>
              <p>2. 保留 1-2 个最有感觉的节点，继续扩写或融合。</p>
              <p>3. 某个方向足够清晰时，锁定成最终 Brief。</p>
            </div>
          </div>
        )}
      </form>
    </motion.div>
  );
}
