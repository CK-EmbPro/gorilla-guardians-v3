import { useEffect, useRef, useCallback } from "react";

type SSEHandler = (event: string, data: unknown) => void;

export function useSSE(userId: number | undefined, onEvent: SSEHandler) {
  const esRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!userId) return;

    const apiBase = (import.meta.env.VITE_API_URL ?? (import.meta.env.BASE_URL ?? "").replace(/\/$/, ""));
    const url = `${apiBase}/api/stream?userId=${userId}`;

    const es = new EventSource(url);
    esRef.current = es;

    const makeHandler = (eventName: string) => (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onEventRef.current(eventName, data);
      } catch {
        // ignore parse errors
      }
    };

    const events = ["connected", "notification", "message", "ping"];
    for (const ev of events) {
      es.addEventListener(ev, makeHandler(ev) as EventListener);
    }

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setTimeout(() => connect(), 4000);
    };
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);
}
