// ===============================================
// 2. HOOK ULTRA-OPTIMIZADO CON RESPUESTA INMEDIATA "SÍ?" FINAL
// src/app/hooks/useRealtimeAgent.ts (VERSIÓN FINAL CORREGIDA)
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
  // NUEVO: Flag para evitar múltiples respuestas inmediatas
  const hasTriggeredImmediateResponseRef = useRef(false);

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

  // Definir disconnect antes para evitar problemas de dependencias
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
    hasTriggeredImmediateResponseRef.current = false;
    
    // Limpiar token pre-obtenido
    delete (window as any).__jarvisToken;
  }, [clearSilenceTimer]);

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      console.log('🕒 Auto-sleep (15s)');
      disconnect();
      
      const callback = onAutoSleepRef.current;
      if (callback) {
        callback();
      }
    }, AUTO_SLEEP_MS);
  }, [clearSilenceTimer, disconnect]);

  // NUEVO: Función para enviar saludo inicial simple
  const sendInitialGreeting = useCallback(async (session: RealtimeSession) => {
    if (hasTriggeredImmediateResponseRef.current) {
      console.log('🚫 Saludo inicial ya enviado');
      return;
    }

    try {
      console.log('🎤 Enviando saludo inicial...');
      hasTriggeredImmediateResponseRef.current = true;
      
      // MÉTODO SIMPLIFICADO: Enviar un "Hola" simple que trigger el saludo
      session.sendMessage({
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Hola' // El agente responderá "Sí?" según sus instrucciones
          }
        ]
      });
      
      console.log('✅ Mensaje de saludo inicial enviado');
      
    } catch (error) {
      console.error('❌ Error enviando saludo inicial:', error);
      hasTriggeredImmediateResponseRef.current = false;
      
      // Reintentar una vez si falla
      setTimeout(() => {
        hasTriggeredImmediateResponseRef.current = false;
      }, 1000);
    }
  }, []);

  // OPTIMIZACIÓN 4: Conexión ULTRA-RÁPIDA con token pre-obtenido
  const connect = useCallback(async () => {
    if (sessionRef.current) return;
    
    try {
      setConnecting(true);
      setStatus('connecting');
      clearSilenceTimer();
      // Resetear flag de respuesta inmediata
      hasTriggeredImmediateResponseRef.current = false;

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

      // OPTIMIZACIÓN 5: Instrucciones optimizadas para saludo automático
      const session = await createAndConnectSession({
        instructions: `Eres JARVIS, asistente IA profesional.

COMPORTAMIENTO AL ACTIVARSE:
- Cuando recibas el primer "Hola" al activarte, responde únicamente con "Sí?" en tono de pregunta
- Para cualquier mensaje posterior del usuario, sé conciso y profesional (máximo 2-3 oraciones)
- Siempre mantén un tono eficiente pero amigable

Tu primera respuesta al activarte debe ser únicamente "Sí?" - esto indica que estás listo para recibir instrucciones.`
      });

      sessionRef.current = session;

      // OPTIMIZACIÓN 6: Configurar eventos básicos de la sesión
      // Solo usar eventos que sabemos que existen según la documentación
      session.on('history_updated', (data) => {
        console.log('📝 Historial actualizado:', data);
        
        // Si acabamos de conectar y no hemos enviado el saludo inicial
        if (connected && !hasTriggeredImmediateResponseRef.current) {
          setTimeout(() => {
            sendInitialGreeting(session);
          }, 200);
        }
      });

      // MEJORADO: Debugging más detallado para eventos de transport
      try {
        const transport = session.transport;
        console.log('🔍 Transport disponible:', !!transport, typeof transport);
        
        if (transport && typeof transport.on === 'function') {
          console.log('✅ Configurando event listeners del transport...');
          
          transport.on('audio_start', () => {
            clearSilenceTimer();
            setStatus('speaking');
            console.log('🗣️ Audio iniciado...');
          });

          transport.on('audio_stop', () => {
            setStatus('listening');
            armSilenceTimer();
            console.log('👂 Audio detenido...');
          });
          
          transport.on('error', (err: any) => {
            console.error('❌ Error en transport:', {
              error: err,
              type: typeof err,
              message: err?.message || 'Sin mensaje',
              stack: err?.stack || 'Sin stack',
              keys: Object.keys(err || {})
            });
            disconnect();
          });
          
          console.log('✅ Event listeners del transport configurados');
        } else {
          console.log('⚠️ Transport no disponible o sin métodos de eventos');
        }
      } catch (e) {
        console.log('ℹ️ Error configurando eventos de transport:', e);
      }

      // MEJORADO: Manejo de errores con mejor debugging
      try {
        console.log('🔍 Configurando error listener de sesión...');
        
        session.on('error' as any, (err: any) => {
          console.error('❌ Error en sesión detallado:', {
            error: err,
            type: typeof err,
            message: err?.message || 'Sin mensaje',
            code: err?.code || 'Sin código',
            stack: err?.stack || 'Sin stack',
            keys: Object.keys(err || {}),
            stringified: JSON.stringify(err, null, 2)
          });
          
          // Solo desconectar si es un error crítico
          if (err?.code === 'connection_error' || err?.message?.includes('connection')) {
            console.log('🔴 Error crítico - desconectando...');
            disconnect();
          } else {
            console.log('⚠️ Error no crítico - continuando...');
          }
        });
        
        console.log('✅ Error listener configurado');
      } catch (e) {
        console.log('ℹ️ Error configurando error listener:', e);
      }

      setConnected(true);
      setStatus('listening');
      
      // NUEVO: Enviar saludo inicial después de conexión exitosa
      setTimeout(() => {
        console.log('🔗 Sesión lista - enviando saludo inicial');
        sendInitialGreeting(session);
      }, 500); // 500ms para asegurar que todo esté listo
      
      console.log('✅ JARVIS ULTRA-CONECTADO con respuesta inmediata');

    } catch (error) {
      console.error('❌ Error conectando:', error);
      setConnected(false);
      setStatus('idle');
      hasTriggeredImmediateResponseRef.current = false;
      
      const callback = onAutoSleepRef.current;
      if (callback) {
        callback();
      }
    } finally {
      setConnecting(false);
    }
  }, [armSilenceTimer, clearSilenceTimer, sendInitialGreeting, disconnect]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
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