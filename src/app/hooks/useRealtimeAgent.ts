'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeSession } from '@openai/agents-realtime';
import { createAndConnectSession } from '../lib/agent/realtime';

export type UiStatus = 'idle'|'connecting'|'listening'|'speaking';

export function useRealtimeAgent() {
  const [status, setStatus]         = useState<UiStatus>('idle');
  const [connected, setConnected]   = useState(false);
  const [connecting, setConnecting] = useState(false);
  const sessionRef = useRef<RealtimeSession|null>(null);

  const connect = useCallback(async () => {
    if (sessionRef.current) return; // ya conectado
    try {
      setConnecting(true);
      setStatus('connecting');

      const session = await createAndConnectSession();
      sessionRef.current = session;

      // Eventos tipados del SDK (evitá TS2345)
      session.on('audio_start',   () => setStatus('speaking'));
      session.on('audio_stopped', () => setStatus('listening'));
      session.on('history_updated',  () => {
        // opcional: leer session.history aquí si querés mostrar transcripción
      });
      session.on('error', (err) => {
        console.error('Realtime error', err);
      });

      setConnected(true);
      setStatus('listening');
    } catch (e) {
      console.error(e);
      setConnected(false);
      setStatus('idle');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    sessionRef.current?.close(); // método correcto del SDK
    sessionRef.current = null;
    setConnected(false);
    setStatus('idle');
  }, []);

  // Limpieza al desmontar
  useEffect(() => () => {
    sessionRef.current?.close();
    sessionRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (connected) disconnect();
    else connect();
  }, [connected, connect, disconnect]);

  return {
    status,
    connected,
    connecting,
    connect,
    disconnect,
    toggle,
  };
}
