'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { ContentType } from '@/types/idea';

const contentTypes: { value: ContentType; label: string }[] = [
  { value: 'video', label: '视频' },
  { value: 'article', label: '文章' },
  { value: 'podcast', label: '播客' },
  { value: 'newsletter', label: 'Newsletter' },
];

export function SeedInput() {
  const router = useRouter();
  const [seedInput, setSeedInput] = useState('');
  const [contentType, setContentType] = useState<ContentType>('video');
  const [channelDescription, setChannelDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedInput.trim()) return;

    setIsLoading(true);
    setError('');
    try {
      const session = await api.createSession({
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seed idea input */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            你的想法种子
          </label>
          <textarea
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            placeholder="输入一个模糊的想法，例如：我想做一期关于 AI 焦虑的视频..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-base resize-none outline-none transition-all"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--bg-border)')}
          />
        </div>

        {/* Content type */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            内容类型
          </label>
          <div className="flex gap-2">
            {contentTypes.map((ct) => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setContentType(ct.value)}
                className="px-4 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: contentType === ct.value ? 'var(--color-primary)' : 'var(--bg-surface)',
                  color: contentType === ct.value ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${contentType === ct.value ? 'var(--color-primary)' : 'var(--bg-border)'}`,
                }}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Channel description (optional) */}
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            频道方向 <span style={{ color: 'var(--text-muted)' }}>(可选)</span>
          </label>
          <input
            type="text"
            value={channelDescription}
            onChange={(e) => setChannelDescription(e.target.value)}
            placeholder="一句话描述你的频道，例如：科技与人文的交叉探索"
            className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--bg-border)')}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-pink)' }}>{error}</p>
        )}

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={!seedInput.trim() || isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-xl text-base font-semibold transition-all disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), #9d91f5)',
            color: '#fff',
            boxShadow: '0 0 30px rgba(124, 108, 240, 0.4)',
          }}
        >
          {isLoading ? '正在启动大爆炸...' : '开始进化'}
        </motion.button>
      </form>
    </motion.div>
  );
}
