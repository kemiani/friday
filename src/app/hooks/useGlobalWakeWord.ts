// src/app/hooks/useGlobalWakeWord.ts
// Hook global para detectar "Jarvis" desde cualquier página

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useReactSpeechWakeWord from './useReactSpeechWakeWord';

type UseGlobalWakeWordProps = {
  enabled?: boolean;
  onWakeDetected?: () => void;
  redirectToAgent?: boolean;
};

export function useGlobalWakeWord({
  enabled = true,
  onWakeDetected,
  redirectToAgent = true
}: UseGlobalWakeWordProps = {}) {
  const router = useRouter();
  const isNavigatingRef = useRef(false);

  const handleWakeDetected = useCallback(() => {
    if (isNavigatingRef.current) return;

    console.log('🌍 WAKE WORD GLOBAL detectado - activando JARVIS');
    
    // Ejecutar callback personalizado si existe
    if (onWakeDetected) {
      onWakeDetected();
    }

    // Redirigir a /agent si está habilitado
    if (redirectToAgent) {
      isNavigatingRef.current = true;
      router.push('/agent');
    }
  }, [router, onWakeDetected, redirectToAgent]);

  const { 
    listening, 
    loading, 
    error,
    isReady,
    start, 
    stop
  } = useReactSpeechWakeWord({
    wakeWords: [
      'jarvis', 
      'hey jarvis', 
      'ok jarvis', 
      'oye jarvis'
    ],
    language: 'es-ES',
    onWake: handleWakeDetected,
    onError: (error: Error) => {
      console.error('❌ Error en wake word global:', error);
    }
  });

  // Auto-iniciar cuando está habilitado y listo
  useEffect(() => {
    if (enabled && isReady && !listening && !loading) {
      const timer = setTimeout(() => {
        if (!isNavigatingRef.current) {
          start();
        }
      }, 1000); // Delay para evitar conflictos

      return () => clearTimeout(timer);
    }
  }, [enabled, isReady, listening, loading, start]);

  // Limpiar flag de navegación
  useEffect(() => {
    const handleRouteChange = () => {
      isNavigatingRef.current = false;
    };

    // Escuchar cambios de ruta
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      isNavigatingRef.current = false;
    };
  }, []);

  return {
    listening,
    loading,
    error,
    isReady,
    start,
    stop,
    enabled: enabled && isReady
  };
}