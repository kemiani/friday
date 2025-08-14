// src/app/hooks/useRealtimeAgent.ts
// Hook ultra-optimizado con auto-redirect a home - COMPLETAMENTE CORREGIDO

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RealtimeSession } from '@openai/agents-realtime';
import { createAndConnectSession } from '../lib/agent/realtime';
import { useAuth } from './useAuth';
import type { User } from '@/app/utils/supabase/supabase';

export type UiStatus = 'idle'|'connecting'|'listening'|'speaking';

const AUTO_SLEEP_MS = 15_000; // 15 segundos

export function useRealtimeAgent() {
  const [status, setStatus] = useState<UiStatus>('idle');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  
  const sessionRef = useRef<RealtimeSession | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onAutoSleepRef = useRef<(() => void) | null>(null);
  
  // OPTIMIZACIÓN 1: Predicción de activación
  const predictionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPreConnectingRef = useRef(false);
  const hasTriggeredImmediateResponseRef = useRef(false);

  // OPTIMIZACIÓN 2: Pre-conexión predictiva
  const preConnect = useCallback(async () => {
    if (isPreConnectingRef.current || sessionRef.current || connected || connecting) {
      return;
    }

    console.log('🔮 PRE-CONECTANDO por predicción...');
    isPreConnectingRef.current = true;

    try {
      const res = await fetch('/api/realtime/session', { cache: 'no-store' });
      const data = await res.json();
      
      if (data?.apiKey) {
        console.log('✅ Token pre-obtenido y listo para uso inmediato');
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

  // NUEVO: Función para redirigir a home de forma segura
  const redirectToSafeZone = useCallback(() => {
    console.log('🏠 Redirigiendo a zona segura (home)...');
    
    // Limpiar todos los timers y referencias
    clearSilenceTimer();
    if (predictionTimeoutRef.current) {
      clearTimeout(predictionTimeoutRef.current);
    }
    
    // Redirigir a home
    router.push('/');
  }, [router, clearSilenceTimer]);

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
      console.log('🕒 Auto-sleep (15s) - desconectando y volviendo a home...');
      disconnect();
      
      // NUEVO: Llamar callback personalizado O redirigir a home
      const callback = onAutoSleepRef.current;
      if (callback) {
        callback();
      } else {
        // Si no hay callback, redirigir automáticamente a home
        redirectToSafeZone();
      }
    }, AUTO_SLEEP_MS);
  }, [clearSilenceTimer, disconnect, redirectToSafeZone]);

  // NUEVO: Función para generar contexto personalizado del usuario
  const generateUserContext = useCallback(() => {
    if (!user) return '';

    const context = `
CONTEXTO DEL USUARIO:
- Nombre: ${user.name || 'Usuario'}
- Email: ${user.email || 'No especificado'}
- Tier: ${user.tier || 'free'}
- Método de auth: ${user.auth_method || 'wallet'}
- Usuario desde: ${new Date(user.created_at).toLocaleDateString('es-ES')}

INSTRUCCIONES PERSONALIZADAS:
- Dirígete al usuario como "${user.name || 'Usuario'}"
- Este es un usuario ${user.tier === 'free' ? 'gratuito' : 'premium'}
- Mantén respuestas concisas pero personalizadas
`.trim();

    return context;
  }, [user]);

  // NUEVO: Función para enviar saludo personalizado
  const sendPersonalizedGreeting = useCallback(async (session: RealtimeSession) => {
    if (hasTriggeredImmediateResponseRef.current) {
      console.log('🚫 Saludo inicial ya enviado');
      return;
    }

    try {
      console.log('🎤 Enviando saludo personalizado...');
      hasTriggeredImmediateResponseRef.current = true;
      
      const greeting = user?.name 
        ? `Hola ${user.name}` 
        : 'Hola';
      
      session.sendMessage({
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: greeting
          }
        ]
      });
      
      console.log(`✅ Saludo personalizado enviado: "${greeting}"`);
      
    } catch (error) {
      console.error('❌ Error enviando saludo personalizado:', error);
      hasTriggeredImmediateResponseRef.current = false;
      
      setTimeout(() => {
        hasTriggeredImmediateResponseRef.current = false;
      }, 1000);
    }
  }, [user]);

  // NUEVO: Función para convertir user de useAuth al tipo User de config.ts
  const convertToConfigUser = useCallback((authUser: typeof user): User | null => {
    if (!authUser) return null;
    
    return {
      id: authUser.id,
      wallet_address: authUser.wallet_address,
      auth_method: authUser.auth_method,
      name: authUser.name,
      email: authUser.email,
      avatar_url: authUser.avatar_url,
      voice_key_hash: undefined, // No disponible en useAuth
      tier: authUser.tier,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
      is_active: true // Asumir activo si está conectado
    };
  }, []);

  // OPTIMIZACIÓN 4: Conexión ULTRA-RÁPIDA con contexto personalizado
  const connect = useCallback(async () => {
    if (sessionRef.current) return;
    
    try {
      setConnecting(true);
      setStatus('connecting');
      clearSilenceTimer();
      hasTriggeredImmediateResponseRef.current = false;

      console.log('⚡ CONEXIÓN ULTRA-RÁPIDA iniciada...');
      
      let apiKey: string | undefined;
      
      // OPTIMIZACIÓN: Usar token pre-obtenido si está disponible
      const preToken = (window as any).__jarvisToken;
      if (preToken && (Date.now() - preToken.timestamp) < 120000) {
        console.log('🚀 Usando token PRE-OBTENIDO - Conexión INSTANTÁNEA');
        apiKey = preToken.apiKey;
        delete (window as any).__jarvisToken;
      } else {
        console.log('🔄 Obteniendo nuevo token...');
        const res = await fetch('/api/realtime/session', { cache: 'no-store' });
        const data = await res.json();
        apiKey = data?.apiKey;
      }

      if (!apiKey) throw new Error('No API key');

      // NUEVO: Generar instrucciones personalizadas
      const userContext = generateUserContext();
      const personalizedInstructions = `Eres JARVIS, asistente IA profesional.

${userContext}

COMPORTAMIENTO AL ACTIVARSE:
- Cuando recibas el primer saludo, responde con "Sí?" o "¿En qué puedo ayudarte?"
- Personaliza tu respuesta usando el nombre del usuario cuando sea apropiado
- Para mensajes posteriores, sé conciso y profesional (máximo 2-3 oraciones)
- Mantén un tono eficiente pero amigable y personalizado

Tu primera respuesta debe ser breve e indicar que estás listo para recibir instrucciones.`;

      console.log('👤 Conectando con contexto personalizado:', user?.name);

      // CORREGIDO: Convertir el tipo de usuario correctamente
      const configUser = convertToConfigUser(user);

      const session = await createAndConnectSession({
        instructions: personalizedInstructions,
        user: configUser // Ahora es del tipo correcto User | null
      });

      sessionRef.current = session;

      // Configurar eventos de la sesión
      session.on('history_updated', (data) => {
        console.log('📝 Historial actualizado:', data);
        
        if (connected && !hasTriggeredImmediateResponseRef.current) {
          setTimeout(() => {
            sendPersonalizedGreeting(session);
          }, 200);
        }
      });

      // Configurar eventos de transport si están disponibles
      try {
        const transport = session.transport;
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
            console.error('❌ Error en transport:', err);
            disconnect();
          });
        }
      } catch (e) {
        console.log('ℹ️ Error configurando eventos de transport:', e);
      }

      // Configurar error handler de sesión
      try {
        session.on('error' as any, (err: any) => {
          console.error('❌ Error en sesión:', err);
          
          if (err?.code === 'connection_error' || err?.message?.includes('connection')) {
            console.log('🔴 Error crítico - desconectando...');
            disconnect();
          }
        });
      } catch (e) {
        console.log('ℹ️ Error configurando error listener:', e);
      }

      setConnected(true);
      setStatus('listening');
      
      // Enviar saludo personalizado después de conexión exitosa
      setTimeout(() => {
        console.log('🔗 Sesión lista - enviando saludo personalizado');
        sendPersonalizedGreeting(session);
      }, 500);
      
      console.log(`✅ JARVIS CONECTADO para ${user?.name || 'Usuario'}`);

    } catch (error) {
      console.error('❌ Error conectando:', error);
      setConnected(false);
      setStatus('idle');
      hasTriggeredImmediateResponseRef.current = false;
      
      // En caso de error, redirigir a home después de un delay
      setTimeout(() => {
        redirectToSafeZone();
      }, 2000);
    } finally {
      setConnecting(false);
    }
  }, [armSilenceTimer, clearSilenceTimer, sendPersonalizedGreeting, disconnect, generateUserContext, user, redirectToSafeZone, convertToConfigUser]);

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
    // NUEVO: Función para redirigir manualmente a zona segura
    redirectToSafeZone,
    // INFO: Información del usuario para debugging
    userInfo: user ? { name: user.name, tier: user.tier } : null
  };
}