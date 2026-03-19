'use client';

import { useEffect, useRef, useCallback } from 'react';
import { WSEvent } from '@/types/idea';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000';

interface UseWebSocketOptions {
  sessionId: string;
  onEvent: (event: WSEvent) => void;
}

export function useWebSocket({ sessionId, onEvent }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/sessions/${sessionId}`);
    wsRef.current = ws;
    let intentionallyClosed = false;

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);
        onEventRef.current(event);
      } catch {
        console.error('WS parse error', e.data);
      }
    };

    ws.onerror = (e) => {
      if (!intentionallyClosed) console.error('WebSocket error', e);
    };

    return () => {
      intentionallyClosed = true;
      wsRef.current = null;
      ws.close();
    };
  }, [sessionId]);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}
