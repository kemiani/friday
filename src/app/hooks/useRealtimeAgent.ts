// src/app/hooks/useRealtimeAgent.ts
// Hook ultra-robusto: single-session global + dedupe por promesa (sin locks por timer)

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RealtimeSession } from '@openai/agents-realtime';
import { createAndConnectSession } from '../lib/agent/realtime';
import { useAuth } from './useAuth';
import type { User } from '@/app/types/db';

export type UiStatus = 'idle'|'connecting'|'listening'|'speaking';

const AUTO_SLEEP_MS = 15_000; // 15s

declare global {
  interface Window {
    __jarvisToken?: { apiKey: string; timestamp: number };
    __jarvisSession?: RealtimeSession | null;
    __jarvisConnectPromise?: Promise<RealtimeSession | null> | null;
  }
}

export function useRealtimeAgent() {
  const [status, setStatus] = useState<UiStatus>('idle');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  const sessionRef = useRef<RealtimeSession | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onAutoSleepRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef<boolean>(false);

  // ===== Timers =====
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      disconnect();
      const cb = onAutoSleepRef.current;
      if (cb) cb();
      else router.push('/');
    }, AUTO_SLEEP_MS);
  }, [clearSilenceTimer, router]);

  const setAutoSleepCallback = useCallback((cb: () => void) => {
    onAutoSleepRef.current = cb;
  }, []);

  // ===== Pre-connect (token caching) =====
  const preConnect = useCallback(async () => {
    // Evita spam: si ya hay sesión o promesa en curso, no pidas token
    if (sessionRef.current || window.__jarvisSession || window.__jarvisConnectPromise) return;
    try {
      const res = await fetch('/api/realtime/session', { cache: 'no-store' });
      const data = await res.json();
      if (data?.apiKey) {
        window.__jarvisToken = { apiKey: data.apiKey, timestamp: Date.now() };
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const t = setTimeout(() => { preConnect(); }, 1500);
    return () => {
      mountedRef.current = false;
      clearTimeout(t);
    };
  }, [preConnect]);

  // ===== Helpers =====
  const convertToConfigUser = useCallback((authUser: typeof user): User | null => {
    if (!authUser) return null;
    return {
      id: authUser.id,
      wallet_address: authUser.wallet_address,
      auth_method: authUser.auth_method,
      name: authUser.name,
      email: authUser.email,
      avatar_url: authUser.avatar_url,
      voice_key_hash: undefined,
      tier: authUser.tier,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
      is_active: true
    };
  }, []);

  // ===== Conectar (con dedupe por promesa global) =====
  const connect = useCallback(async () => {
    if (!mountedRef.current) return;

    // 1) Si ya hay sesión global, úsala
    if (window.__jarvisSession) {
      sessionRef.current = window.__jarvisSession;
      setConnected(true);
      setStatus('listening');
      return;
    }

    // 2) Si hay una conexión en curso, esperala (evita múltiples instancias)
    if (window.__jarvisConnectPromise) {
      setConnecting(true);
      setStatus('connecting');
      try {
        const s = await window.__jarvisConnectPromise;
        if (!mountedRef.current) return;
        sessionRef.current = s;
        setConnected(!!s);
        setStatus(s ? 'listening' : 'idle');
      } finally {
        setConnecting(false);
      }
      return;
    }

    // 3) Crear la promesa única de conexión
    const doConnect = (async (): Promise<RealtimeSession | null> => {
      try {
        setConnecting(true);
        setStatus('connecting');
        clearSilenceTimer();

        // Reutilizá token efímero si está fresco
        let apiKey: string | undefined;
        const cached = window.__jarvisToken;
        if (cached && (Date.now() - cached.timestamp) < 120000) {
          apiKey = cached.apiKey;
          window.__jarvisToken = undefined;
        } else {
          const res = await fetch('/api/realtime/session', { cache: 'no-store' });
          const data = await res.json();
          apiKey = data?.apiKey;
        }
        if (!apiKey) throw new Error('No API key');

        const personalizedInstructions = `Eres JARVIS, asistente IA.`;
        const cfgUser = convertToConfigUser(user);

        const s = await createAndConnectSession({
          instructions: personalizedInstructions,
          user: cfgUser
        });

        // Eventos (best-effort; algunos transports no exponen esto)
        try {
          const transport: unknown = (s as unknown as Record<string, unknown>).transport;
          const t = transport as { on?: (ev: string, cb: () => void) => void };
          if (t?.on) {
            t.on('audio_start', () => {
              clearSilenceTimer();
              setStatus('speaking');
            });
            t.on('audio_stop', () => {
              setStatus('listening');
              armSilenceTimer();
            });
            t.on('error', () => {
              disconnect();
            });
          }
        } catch {
          // ignore
        }

        return s;
      } catch {
        return null;
      }
    })();

    // Registrar promesa global para dedupe
    window.__jarvisConnectPromise = doConnect;

    // Esperar resultado
    const session = await doConnect;
    // Limpiar la promesa global
    window.__jarvisConnectPromise = null;

    if (!mountedRef.current) {
      // Si el componente se desmontó, cerrá la sesión recién creada
      if (session) {
        try { session.close(); } catch {}
      }
      setConnecting(false);
      return;
    }

    // Setear sesión global y local si existe
    if (session) {
      window.__jarvisSession = session;
      sessionRef.current = session;
      setConnected(true);
      setStatus('listening');
      armSilenceTimer();
    } else {
      // falló la conexión
      setConnected(false);
      setStatus('idle');
      setTimeout(() => { router.push('/'); }, 1200);
    }

    setConnecting(false);
  }, [armSilenceTimer, clearSilenceTimer, convertToConfigUser, router, user]);

  // ===== Desconectar =====
  const disconnect = useCallback(() => {
    clearSilenceTimer();

    // Cerrar sesión global y local
    const s = sessionRef.current || window.__jarvisSession || null;
    if (s) {
      try { s.close(); } catch {}
    }
    sessionRef.current = null;
    window.__jarvisSession = null;

    setConnected(false);
    setStatus('idle');
  }, [clearSilenceTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearSilenceTimer();
      // No cierro la sesión global en unmount del hook:
      // si hay otra vista usando el mismo hook, la reusa.
      // Si querés cerrar siempre, descomentá:
      // try { window.__jarvisSession?.close(); } catch {}
    };
  }, [clearSilenceTimer]);

  return {
    status,
    connected,
    connecting,
    connect,
    disconnect,
    setAutoSleepCallback,
    userInfo: user ? { name: user.name, tier: user.tier } : null
  };
}
