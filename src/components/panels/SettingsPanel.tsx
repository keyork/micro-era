'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLLMConfig } from '@/hooks/useLLMConfig';

type TestState = 'idle' | 'testing' | 'success' | 'error';

interface Props {
  defaultOpen?: boolean;
}

export function SettingsPanel({ defaultOpen = false }: Props) {
  const { config, setConfig, isConfigured } = useLLMConfig();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [testState, setTestState] = useState<TestState>('idle');
  const [testMessage, setTestMessage] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleTest = async () => {
    if (testState === 'testing') return;

    const apiKey = config.apiKey.trim();
    const model = (config.model || 'gpt-4o-mini').trim();
    const rawBaseUrl = (config.baseUrl || 'https://api.openai.com/v1').trim();
    let baseUrl = rawBaseUrl.replace(/\/+$/, '');

    if (!apiKey) {
      setTestState('error');
      setTestMessage('填一下 API Key');
      return;
    }

    if (!model) {
      setTestState('error');
      setTestMessage('填一下 Model Name');
      return;
    }

    try {
      const parsed = new URL(baseUrl);
      if (!/^https?:$/.test(parsed.protocol)) {
        throw new Error('URL must use http or https.');
      }
      baseUrl = parsed.toString().replace(/\/+$/, '');
    } catch {
      setTestState('error');
      setTestMessage('Base URL 格式不正确，例如 https://api.openai.com/v1');
      return;
    }

    if (baseUrl !== config.baseUrl || model !== config.model || apiKey !== config.apiKey) {
      setConfig({ baseUrl, model, apiKey });
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setTestState('testing');
    setTestMessage('');

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          max_tokens: 16,
          messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 120)}`);
      }

      setTestState('success');
      setTestMessage(`连接成功，当前模型: ${model}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setTestState('error');
      const msg = err instanceof TypeError
        ? '连接失败。请检查 Base URL、网络/CORS 策略，或确认该兼容接口允许浏览器直接调用。'
        : err instanceof Error ? err.message : '连接失败';
      setTestMessage(msg);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  const testStateStyles: Record<TestState, { bg: string; color: string }> = {
    idle: { bg: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' },
    testing: { bg: 'rgba(111,119,255,0.12)', color: 'var(--color-primary)' },
    success: { bg: 'rgba(83,198,175,0.12)', color: 'var(--color-teal)' },
    error: { bg: 'rgba(240,108,140,0.10)', color: 'var(--color-pink)' },
  };

  const testStyle = testStateStyles[testState];

  return (
    <div
      className="overflow-hidden rounded-[24px]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        boxShadow: '0 22px 70px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.015)',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 transition-all"
        style={{ color: 'var(--text-primary)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">API 设置</span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              background: isConfigured ? 'rgba(83,198,175,0.12)' : 'rgba(241,198,109,0.10)',
              color: isConfigured ? 'var(--color-teal)' : 'var(--color-gold)',
            }}
          >
            {isConfigured ? '已配置' : '未配置'}
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  API Key <span style={{ color: 'var(--color-pink)' }}>*</span>
                </label>
                <input
                  type="password"
                  name="llm-api-key"
                  autoComplete="off"
                  value={config.apiKey}
                  onChange={(e) => { setConfig({ apiKey: e.target.value }); setTestState('idle'); }}
                  placeholder="sk-..."
                  className="cosmic-input w-full rounded-2xl px-4 py-3 text-sm"
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  密钥只存在你的浏览器里，不会上传。
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Base URL <span style={{ color: 'var(--text-muted)' }}>(可选)</span>
                </label>
                <input
                  type="url"
                  name="llm-base-url"
                  autoComplete="url"
                  value={config.baseUrl}
                  onChange={(e) => { setConfig({ baseUrl: e.target.value }); setTestState('idle'); }}
                  placeholder="https://api.openai.com/v1"
                  className="cosmic-input w-full rounded-2xl px-4 py-3 text-sm"
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  留空默认 OpenAI。也支持 Moonshot、DeepSeek 等兼容接口。
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  模型 <span style={{ color: 'var(--text-muted)' }}>(可选)</span>
                </label>
                <input
                  type="text"
                  name="llm-model-name"
                  autoComplete="off"
                  value={config.model}
                  onChange={(e) => { setConfig({ model: e.target.value }); setTestState('idle'); }}
                  placeholder="gpt-4o-mini"
                  className="cosmic-input w-full rounded-2xl px-4 py-3 text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testState === 'testing'}
                  className="rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 disabled:opacity-30"
                  style={{
                    background: testStyle.bg,
                    color: testStyle.color,
                    boxShadow: '0 14px 30px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.02)',
                  }}
                >
                  {testState === 'testing' ? '测试中...' : testState === 'success' ? '连接正常 ✓' : testState === 'error' ? '重新测试' : '测试连接'}
                </button>
                {testState === 'testing' && (
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{
                      background:
                        'conic-gradient(from 180deg, rgba(111,119,255,0.08), var(--color-primary), rgba(83,198,175,0.42), rgba(111,119,255,0.08))',
                      WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
                      mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
                      animation: 'studio-spin 0.9s linear infinite',
                    }}
                  />
                )}
              </div>

              {testMessage && (
                <p className="text-xs leading-5" style={{ color: testStyle.color }}>
                  {testMessage}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
