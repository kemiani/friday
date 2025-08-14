// src/app/agent/page.tsx
// Página del agente con auto-redirect a home

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentShell from '../components/AgentUI/AgentShell';
import { useRealtimeAgent } from '../hooks/useRealtimeAgent';
import useReactSpeechWakeWord from '../hooks/useReactSpeechWakeWord';
import { useAuth } from '../hooks/useAuth';

export default function AgentPage() {
  const { 
    connected, 
    connecting, 
    status, 
    connect, 
    disconnect, 
    setAutoSleepCallback,
    userInfo
  } = useRealtimeAgent();

  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Estado para detectar que estamos en cliente
  const [isClient, setIsClient] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);

  // Referencias para evitar activaciones duplicadas
  const isActivatingRef = useRef(false);
  const activationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar autenticación
  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.push('/');
      return;
    }
  }, [isClient, isAuthenticated, router]);

  // Detectar soporte de Speech Recognition solo en cliente
  useEffect(() => {
    setIsClient(true);
    const isSupported = typeof window !== 'undefined' && 
                       ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setSpeechSupported(isSupported);
  }, []);

  // Auto-sleep => volver a home
  const handleAutoSleep = useCallback(() => {
    setTimeout(() => {
      router.push('/');
    }, 1000);
  }, [router]);

  // Hook de wake word (solo activo cuando no está conectado)
  const { 
    listening: wakeListening, 
    loading: wakeLoading, 
    error: wakeError,
    isReady: wakeReady,
    start: startWakeWord, 
    stop: stopWakeWord
  } = useReactSpeechWakeWord({
    wakeWords: ['jarvis', 'hey jarvis', 'ok jarvis', 'oye jarvis'],
    language: 'es-ES',
    onWake: () => {
      if (isActivatingRef.current || connected || connecting) return;
      isActivatingRef.current = true;

      if (activationTimeoutRef.current) clearTimeout(activationTimeoutRef.current);

      connect()
        .then(() => {
          console.log(`🚀 JARVIS activado para ${userInfo?.name || 'usuario'}`);
        })
        .catch((error) => {
          console.error('❌ Error activando JARVIS:', error);
        })
        .finally(() => {
          isActivatingRef.current = false;
        });
    },
    onError: (error: Error) => {
      console.error('❌ Error en wake word:', error);
      isActivatingRef.current = false;
    }
  });

  const _reactivateWakeWord = useCallback(() => {
    if (wakeReady && !wakeListening && !connected && !connecting && !isActivatingRef.current) {
      startWakeWord();
    }
  }, [startWakeWord, wakeReady, wakeListening, connected, connecting]);

  // Configurar callback de auto-sleep
  useEffect(() => {
    setAutoSleepCallback(handleAutoSleep);
  }, [setAutoSleepCallback, handleAutoSleep]);

  // Orquestación optimizada solo cuando estamos en cliente
  useEffect(() => {
    if (!isClient || speechSupported === null || !isAuthenticated) return;
    if (!speechSupported) return;

    if (!connected && !connecting && !isActivatingRef.current) {
      if (wakeReady && !wakeListening && !wakeLoading) {
        startWakeWord();
      }
    }

    if (connected && wakeListening) {
      stopWakeWord();
    }
  }, [
    isClient,
    speechSupported,
    isAuthenticated,
    wakeReady, 
    connected, 
    connecting, 
    wakeListening, 
    wakeLoading, 
    startWakeWord, 
    stopWakeWord
  ]);

  const handleToggle = useCallback(() => {
    if (connecting || isActivatingRef.current) return;

    if (connected) {
      disconnect();
      setTimeout(() => {
        if (wakeReady && !wakeListening) startWakeWord();
      }, 100);
    } else {
      isActivatingRef.current = true;
      connect().finally(() => {
        isActivatingRef.current = false;
      });
    }
  }, [connected, connecting, wakeListening, wakeReady, disconnect, startWakeWord, connect]);

  const handleBackToHome = useCallback(() => {
    if (connected) disconnect();
    router.push('/');
  }, [connected, disconnect, router]);

  useEffect(() => {
    const timeoutRef = activationTimeoutRef.current;
    return () => {
      if (timeoutRef) clearTimeout(timeoutRef);
      isActivatingRef.current = false;
    };
  }, []);

  // Loading state
  if (!isClient || speechSupported === null || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-8"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-cyan-300/50 rounded-full animate-spin mx-auto" style={{animationDuration: '1.5s', animationDirection: 'reverse'}}></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Inicializando J.A.R.V.I.S.</h2>
          <p className="text-cyan-400 text-lg">
            {!isAuthenticated ? 'Verificando autenticación...' : 'Verificando sistemas...'}
          </p>
        </div>
      </div>
    );
  }

  // Navegador no compatible
  if (!speechSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center p-6">
        <div className="max-w-2xl bg-slate-800/50 backdrop-blur-sm border border-red-500/30 rounded-3xl p-8 text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-3xl font-bold text-red-400 mb-6">Navegador No Compatible</h2>

          {/* ... contenido tal como lo tenías ... */}

          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                isActivatingRef.current = true;
                connect().finally(() => {
                  isActivatingRef.current = false;
                });
              }}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
            >
              🎤 Activar JARVIS Manualmente
            </button>
            <button
              onClick={handleBackToHome}
              className="px-8 py-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              🏠 Volver a Inicio
            </button>
          </div>

          <p className="text-slate-400 text-sm mt-4">Sin wake word, usa el botón para activar</p>
        </div>
      </div>
    );
  }

  // Render principal
  return (
    <AgentShell
      connected={connected}
      connecting={connecting}
      status={status}
      onToggle={handleToggle}
      wakeListening={wakeListening}
      wakeError={wakeError}
    >
      <div className="absolute top-6 left-6 z-20">
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full px-3 py-2">
              {/* Puedes cambiar <img> por <Image> luego para evitar el warning */}
              <img 
                src={user.avatar_url || ''} 
                alt="Avatar" 
                className="w-6 h-6 rounded-full"
              />
              <span className="text-white text-sm font-medium">
                {user?.name || 'Usuario'}
              </span>
            </div>
          )}
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full px-3 py-2 hover:bg-slate-700/50 transition-colors"
            title="Volver a inicio"
          >
            <span className="text-lg">🏠</span>
            <span className="text-white text-sm font-medium">Inicio</span>
          </button>
        </div>
      </div>

      {connected && (
        <div className="absolute top-6 right-6 z-20">
          <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm border border-green-400/50 rounded-full px-3 py-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">Conectado</span>
          </div>
        </div>
      )}
    </AgentShell>
  );
}
