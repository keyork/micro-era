'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'llm_config';
const SYNC_EVENT = 'llm-config-sync';

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const DEFAULT_CONFIG: LLMConfig = {
  apiKey: '',
  baseUrl: '',
  model: 'gpt-4o-mini',
};

function loadConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

function saveConfigAndNotify(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event(SYNC_EVENT));
  } catch { /* ignore */ }
}

export function useLLMConfig() {
  const [config, setConfigState] = useState<LLMConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setConfigState(loadConfig());
    setIsLoaded(true);

    const sync = () => setConfigState(loadConfig());
    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setConfig = useCallback((update: Partial<LLMConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...update };
      saveConfigAndNotify(next);
      return next;
    });
  }, []);

  const isConfigured = config.apiKey.trim().length > 0;

  return { config, setConfig, isConfigured, isLoaded };
}
