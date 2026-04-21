'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { ContentType } from '@/types/idea';
import { useLLMConfig } from '@/hooks/useLLMConfig';

const contentTypes: { value: ContentType; label: string }[] = [
  { value: 'video', label: '视频' },
  { value: 'article', label: '文章' },
  { value: 'podcast', label: '播客' },
  { value: 'newsletter', label: 'Newsletter' },
];

const seedExamples = [
  {
    title: 'AI 焦虑',
    seedInput: '我想做一期关于 AI 焦虑的视频，但不想只讲工具和效率，更想讲人在被技术推动时的心理失衡。',
    channelDescription: '科技变化下的真实心理体验',
    contentType: 'video' as ContentType,
  },
  {
    title: '消费降级',
    seedInput: '我想聊聊年轻人消费降级，但不想做省钱攻略，而是想讲为什么大家开始重新定义体面和安全感。',
    channelDescription: '生活方式背后的时代情绪',
    contentType: 'article' as ContentType,
  },
  {
    title: '内容创作者',
    seedInput: '我想做一期关于内容创作者疲惫感的选题，重点不是抱怨平台，而是为什么越努力更新越容易失去表达欲。',
    channelDescription: '创作心理与媒介环境观察',
    contentType: 'podcast' as ContentType,
  },
];

const submitStages = [
  {
    title: '建立创作会话',
    detail: '保存你的种子主题、内容类型与频道上下文。',
  },
  {
    title: '准备实时画板',
    detail: '下一页会自动连接演化引擎，并接收第一批方向节点。',
  },
  {
    title: '进入工作台',
    detail: '把等待过程变成可见反馈，而不是空白跳转。',
  },
];

export function SeedInput() {
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
    ? '先写一个你最近反复想到、但还没想清楚的主题。'
    : seedInput.trim().length < 18
      ? '再补一点情绪、矛盾或你的观察，这样后面的分支会更有意思。'
      : '这个输入已经够用了，进入画板后系统会先帮你展开第一代方向。';

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
          把模糊想法送进演化引擎
        </h2>
        <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
          这里输入的是起点，不是答案。越具体的场景、情绪或矛盾，后面的分支越有质量。
        </p>
      </div>

      <div
        className="mb-6 rounded-[24px] p-4"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              不知道怎么开头？
            </p>
            <p className="text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
              可以先点一个示例，再按你的想法改。
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ background: 'rgba(111,119,255,0.12)', color: 'var(--color-primary)' }}
          >
            Quick Start
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {seedExamples.map((example) => (
            <button
              key={example.title}
              type="button"
              onClick={() => {
                setSeedInput(example.seedInput);
                setChannelDescription(example.channelDescription);
                setContentType(example.contentType);
              }}
              className="cosmic-lift rounded-2xl px-4 py-3 text-left"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {example.title}
              </p>
              <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                {example.seedInput.slice(0, 32)}...
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ['种子', '描述一个想做但还没定型的内容念头'],
          ['形态', '决定它最终更像视频、文章还是播客'],
          ['画板', '进入可视化工作台继续筛选与锁定'],
        ].map(([title, description], index) => (
          <div
            key={title}
            className="rounded-2xl px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
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
            写"主题 + 你想抓住的情绪 / 冲突 / 观察"，比只写一个宽泛关键词更有用。
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
                  className="rounded-2xl px-4 py-3 text-sm transition-all duration-300"
                  style={{
                    background: isActive ? 'rgba(111, 119, 255, 0.15)' : 'rgba(255,255,255,0.025)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: `1px solid ${isActive ? 'rgba(111, 119, 255, 0.4)' : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: isActive ? '0 0 16px rgba(111,119,255,0.12), 0 0 0 1px rgba(111,119,255,0.08) inset' : 'none',
                  }}
                >
                  {ct.label}
                </button>
              );
            })}
          </div>
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
          <p className="rounded-2xl px-4 py-3 text-sm" style={{ color: 'var(--color-pink)', background: 'rgba(240,108,140,0.06)', border: '1px solid rgba(240,108,140,0.15)' }}>
            {error}
          </p>
        )}

        {!isConfigured && (
          <div className="rounded-[24px] p-4" style={{ background: 'rgba(241,198,109,0.06)', border: '1px solid rgba(241,198,109,0.14)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-gold)' }}>
              请先配置 API Key
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              进入演化工作台需要调用 LLM，请在页面底部设置你的 API Key。
            </p>
          </div>
        )}

        {isLoading && (
          <div
            className="space-y-3 rounded-[24px] p-4"
            style={{
              background: 'linear-gradient(180deg, rgba(111,125,247,0.10), rgba(255,255,255,0.02))',
              border: '1px solid rgba(111,125,247,0.16)',
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  正在准备你的工作台
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  创建会话后会自动进入实时演化画板。
                </p>
              </div>
              <div
                className="h-10 w-10 rounded-full"
                style={{
                  border: '2px solid rgba(111,119,247,0.14)',
                  borderTopColor: 'var(--color-primary)',
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
                      border: `1px solid ${isActive ? 'rgba(255,255,255,0.06)' : 'transparent'}`,
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
          {isLoading ? '正在创建工作台...' : '进入演化工作台'}
        </motion.button>

        {!isLoading && (
          <div className="rounded-[24px] p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              进入后你会看到什么
            </p>
            <div className="space-y-2 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
              <p>1. 系统先展开第一批候选方向，不需要你盯着空白页等。</p>
              <p>2. 你只要保留 1-2 个最有感觉的节点，继续扩写或融合。</p>
              <p>3. 当某个方向足够清晰时，再锁定成最终 Brief。</p>
            </div>
          </div>
        )}
      </form>
    </motion.div>
  );
}
