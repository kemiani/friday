'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeSession } from '@openai/agents-realtime';
import { createAndConnectSession } from '../lib/agent/realtime';

export type UiStatus = 'idle'|'connecting'|'listening'|'speaking';

const AUTO_SLEEP_MS = 20_000; // 20 segundos de silencio antes de auto-sleep

export function useRealtimeAgent() {
  const [status, setStatus] = useState<UiStatus>('idle');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onAutoSleepRef = useRef<(() => void) | null>(null);

  // Función para configurar callback de auto-sleep
  const setAutoSleepCallback = useCallback((callback: () => void) => {
    onAutoSleepRef.current = callback;
  }, []);

  // Función para limpiar timer de silencio
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Función para armar timer de silencio
  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    console.log('⏰ Armando timer de auto-sleep (20s)...');
    silenceTimerRef.current = setTimeout(() => {
      console.log('🕒 Auto-sleep por inactividad (20s)');
      // Primero desconectar
      disconnect();
      // Luego reactivar wake word si hay callback
      if (onAutoSleepRef.current) {
        onAutoSleepRef.current();
      }
    }, AUTO_SLEEP_MS);
  }, [clearSilenceTimer]);

  const connect = useCallback(async () => {
    if (sessionRef.current) return; // ya conectado
    
    try {
      setConnecting(true);
      setStatus('connecting');
      clearSilenceTimer();

      console.log('🔵 Conectando a OpenAI Realtime...');
      const session = await createAndConnectSession({
        instructions: `Eres JARVIS, el asistente inteligente de Tony Stark. 
        
PERSONALIDAD:
- Inteligente, sofisticado y eficiente
- Profesional pero amigable
- Confiado en tus capacidades
- Ocasionalmente un toque de humor británico sutil

COMPORTAMIENTO:
- Responde de manera concisa pero completa
- Si necesitas tiempo para procesar, di: "Un momento, procesando..."
- Mantén un tono profesional pero cálido
- Puedes hacer referencia a ser un sistema de IA avanzado

CONTEXTO:
- Eres un asistente de voz en tiempo real
- Puedes ayudar con cualquier consulta o conversación
- Actúa como un confidente inteligente y confiable
- Puedes ser tanto asistente técnico como amigo para conversar

Mantén las respuestas naturales y conversacionales.`
      });

      sessionRef.current = session;

      // Eventos de la sesión con auto-sleep
      session.on('audio_start', () => {
        console.log('🔊 JARVIS comenzó a hablar');
        clearSilenceTimer();
        setStatus('speaking');
      });

      session.on('audio_stopped', () => {
        console.log('🎤 JARVIS terminó de hablar - Escuchando respuesta');
        setStatus('listening');
        armSilenceTimer(); // Activar timer de silencio
      });

      session.on('history_updated', () => {
        // Opcional: manejar actualizaciones del historial
        console.log('📝 Conversación actualizada');
      });

      session.on('error', (err) => {
        console.error('❌ Error en Realtime:', err);
        disconnect();
      });

      // Configurar estado inicial
      setConnected(true);
      setStatus('listening');
      armSilenceTimer(); // Empezar timer desde el inicio

      console.log('✅ JARVIS conectado y listo');

    } catch (error) {
      console.error('❌ Error conectando:', error);
      setConnected(false);
      setStatus('idle');
      
      // Reactivar wake word si hay callback
      if (onAutoSleepRef.current) {
        onAutoSleepRef.current();
      }
    } finally {
      setConnecting(false);
    }
  }, [armSilenceTimer, clearSilenceTimer]);

  const disconnect = useCallback(() => {
    console.log('🔴 Desconectando JARVIS...');
    
    clearSilenceTimer();
    
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    
    setConnected(false);
    setStatus('idle');
    
    console.log('🛑 JARVIS desconectado');
  }, [clearSilenceTimer]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
    };
  }, [clearSilenceTimer]);

  const toggle = useCallback(() => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  }, [connected, connect, disconnect]);

  return {
    status,
    connected,
    connecting,
    connect,
    disconnect,
    toggle,
    setAutoSleepCallback,
  };
}