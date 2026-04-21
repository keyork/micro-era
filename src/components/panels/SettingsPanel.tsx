'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { callLLM } from '@/lib/llm/client';

type TestState = 'idle' | 'testing' | 'success' | 'error';

export function SettingsPanel() {
  const { config, setConfig, isConfigured } = useLLMConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [testState, setTestState] = useState<TestState>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleTest = async () => {
    if (!config.apiKey.trim()) {
      setTestState('error');
      setTestMessage('请先填写 API Key');
      return;
    }

    setTestState('testing');
    setTestMessage('');

    try {
      await callLLM(config, '你是一个测试助手。', '请回复"连接成功"四个字。');
      setTestState('success');
      setTestMessage('连接成功！API 配置正确。');
    } catch (err) {
      setTestState('error');
      const msg = err instanceof Error ? err.message : '连接失败';
      setTestMessage(msg);
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
    <div className="rounded-[24px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <button
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
                  value={config.apiKey}
                  onChange={(e) => { setConfig({ apiKey: e.target.value }); setTestState('idle'); }}
                  placeholder="sk-..."
                  className="cosmic-input w-full rounded-2xl px-4 py-3 text-sm"
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  密钥保存在浏览器本地，不会发送到任何服务器。
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Base URL <span style={{ color: 'var(--text-muted)' }}>(可选)</span>
                </label>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => { setConfig({ baseUrl: e.target.value }); setTestState('idle'); }}
                  placeholder="https://api.openai.com/v1"
                  className="cosmic-input w-full rounded-2xl px-4 py-3 text-sm"
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  留空使用 OpenAI；可填 Moonshot、DeepSeek 等兼容接口地址。
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  模型 <span style={{ color: 'var(--text-muted)' }}>(可选)</span>
                </label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => { setConfig({ model: e.target.value }); setTestState('idle'); }}
                  placeholder="gpt-4o-mini"
                  className="cosmic-input w-full rounded-2xl px-4 py-3 text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTest}
                  disabled={testState === 'testing'}
                  className="rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 disabled:opacity-30"
                  style={{ background: testStyle.bg, color: testStyle.color, border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {testState === 'testing' ? '测试中...' : testState === 'success' ? '测试通过 ✓' : testState === 'error' ? '重新测试' : '测试连接'}
                </button>
                {testState === 'testing' && (
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{
                      border: '2px solid rgba(111,119,255,0.14)',
                      borderTopColor: 'var(--color-primary)',
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
