'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ConnectionStatus, WSEvent } from '@/types/idea';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000';

interface UseWebSocketOptions {
  sessionId: string;
  onEvent: (event: WSEvent) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  enabled?: boolean;
}

export function useWebSocket({ sessionId, onEvent, onStatusChange, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const onStatusChangeRef = useRef(onStatusChange);
  onEventRef.current = onEvent;
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    onStatusChangeRef.current?.('connecting');
    const ws = new WebSocket(`${WS_BASE}/ws/sessions/${sessionId}`);
    wsRef.current = ws;
    let intentionallyClosed = false;

    ws.onopen = () => {
      onStatusChangeRef.current?.('connected');
    };

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);
        onEventRef.current(event);
      } catch {
        console.error('WS parse error', e.data);
      }
    };

    ws.onerror = (e) => {
      if (!intentionallyClosed) {
        onStatusChangeRef.current?.('disconnected');
        console.error('WebSocket error', e);
      }
    };

    ws.onclose = () => {
      if (!intentionallyClosed) {
        onStatusChangeRef.current?.('disconnected');
      }
    };

    return () => {
      intentionallyClosed = true;
      wsRef.current = null;
      ws.close();
    };
  }, [enabled, sessionId]);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  return { send };
}
