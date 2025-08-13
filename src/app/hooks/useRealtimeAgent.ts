// ===============================================
// 2. HOOK ULTRA-OPTIMIZADO CON PREDICCIÓN
// src/app/hooks/useRealtimeAgent.ts (VERSIÓN 2.0)
// ===============================================

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeSession } from '@openai/agents-realtime';
import { createAndConnectSession } from '../lib/agent/realtime';

export type UiStatus = 'idle'|'connecting'|'listening'|'speaking';

const AUTO_SLEEP_MS = 15_000; // Reducido a 15 segundos

export function useRealtimeAgent() {
  const [status, setStatus] = useState<UiStatus>('idle');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onAutoSleepRef = useRef<(() => void) | null>(null);
  
  // OPTIMIZACIÓN 1: Predicción de activación
  const predictionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPreConnectingRef = useRef(false);

  // OPTIMIZACIÓN 2: Pre-conexión predictiva
  const preConnect = useCallback(async () => {
    if (isPreConnectingRef.current || sessionRef.current || connected || connecting) {
      return;
    }

    console.log('🔮 PRE-CONECTANDO por predicción...');
    isPreConnectingRef.current = true;

    try {
      // Pre-fetch del token sin conectar aún
      const res = await fetch('/api/realtime/session', { cache: 'no-store' });
      const data = await res.json();
      
      if (data?.apiKey) {
        console.log('✅ Token pre-obtenido y listo para uso inmediato');
        // Guardar token para uso inmediato
        (window as any).__jarvisToken = {
          apiKey: data.apiKey,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.log('⚠️ Error en pre-conexión:', error);
    } finally {
      isPreConnectingRef.current = false;
    }
  }, [connected, connecting]);

  // OPTIMIZACIÓN 3: Activar pre-conexión cuando wake word esté activo
  useEffect(() => {
    // Pre-conectar después de 3 segundos de wake word activo
    predictionTimeoutRef.current = setTimeout(() => {
      preConnect();
    }, 3000);

    return () => {
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
    };
  }, [preConnect]);

  const setAutoSleepCallback = useCallback((callback: () => void) => {
    onAutoSleepRef.current = callback;
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      console.log('🕒 Auto-sleep (15s)');
      disconnect();
      if (onAutoSleepRef.current) {
        onAutoSleepRef.current();
      }
    }, AUTO_SLEEP_MS);
  }, [clearSilenceTimer]);

  // OPTIMIZACIÓN 4: Conexión ULTRA-RÁPIDA con token pre-obtenido
  const connect = useCallback(async () => {
    if (sessionRef.current) return;
    
    try {
      setConnecting(true);
      setStatus('connecting');
      clearSilenceTimer();

      console.log('⚡ CONEXIÓN ULTRA-RÁPIDA iniciada...');
      
      let apiKey: string | undefined;
      
      // OPTIMIZACIÓN: Usar token pre-obtenido si está disponible
      const preToken = (window as any).__jarvisToken;
      if (preToken && (Date.now() - preToken.timestamp) < 120000) { // 2 minutos de validez
        console.log('🚀 Usando token PRE-OBTENIDO - Conexión INSTANTÁNEA');
        apiKey = preToken.apiKey;
        // Limpiar token usado
        delete (window as any).__jarvisToken;
      } else {
        console.log('🔄 Obteniendo nuevo token...');
        const res = await fetch('/api/realtime/session', { cache: 'no-store' });
        const data = await res.json();
        apiKey = data?.apiKey;
      }

      if (!apiKey) throw new Error('No API key');

      // OPTIMIZACIÓN 5: Instrucciones ultra-concisas
      const session = await createAndConnectSession({
        instructions: 'Responde INMEDIATAMENTE. Di "Sí" para confirmaciones. Máxima brevedad.'
      });

      sessionRef.current = session;

      // OPTIMIZACIÓN 6: Eventos con menor latencia
      session.on('audio_start', () => {
        clearSilenceTimer();
        setStatus('speaking');
      });

      session.on('audio_stopped', () => {
        setStatus('listening');
        armSilenceTimer();
      });

      session.on('error', (err) => {
        console.error('❌ Error:', err);
        disconnect();
      });

      setConnected(true);
      setStatus('listening');
      
      console.log('✅ JARVIS ULTRA-CONECTADO');

    } catch (error) {
      console.error('❌ Error conectando:', error);
      setConnected(false);
      setStatus('idle');
      
      if (onAutoSleepRef.current) {
        onAutoSleepRef.current();
      }
    } finally {
      setConnecting(false);
    }
  }, [armSilenceTimer, clearSilenceTimer]);

  const disconnect = useCallback(() => {
    console.log('🔴 Desconectando...');
    
    clearSilenceTimer();
    
    if (predictionTimeoutRef.current) {
      clearTimeout(predictionTimeoutRef.current);
    }
    
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    
    setConnected(false);
    setStatus('idle');
    isPreConnectingRef.current = false;
    
    // Limpiar token pre-obtenido
    delete (window as any).__jarvisToken;
  }, [clearSilenceTimer]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
      if (sessionRef.current) {
        sessionRef.current.close();
      }
    };
  }, [clearSilenceTimer]);

  return {
    status,
    connected,
    connecting,
    connect,
    disconnect,
    setAutoSleepCallback,
  };
}

