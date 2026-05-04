'use client';

import { motion } from 'framer-motion';
import { SettingsPanel } from '@/components/panels/SettingsPanel';

export function HomeApiView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >
      <div className="mb-4">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: 'var(--color-gold)' }}
        >
          API Control
        </p>
        <h2
          className="mt-3 text-xl font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          把模型接上，再点火。
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
          支持 OpenAI 和兼容接口。Key 只存在浏览器本地，不会经过任何服务器。
        </p>
      </div>

      <SettingsPanel defaultOpen />
    </motion.div>
  );
}
