'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import AgentShell from '../components/AgentUI/AgentShell';
import { useRealtimeAgent } from '../hooks/useRealtimeAgent';
import useReactSpeechWakeWord from '../hooks/useReactSpeechWakeWord';

export default function AgentPage() {
  const { 
    connected, 
    connecting, 
    status, 
    connect, 
    disconnect, 
    setAutoSleepCallback 
  } = useRealtimeAgent();

  // Estado para detectar que estamos en cliente
  const [isClient, setIsClient] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);

  // Referencias para evitar activaciones duplicadas
  const isActivatingRef = useRef(false);
  const activationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar soporte de Speech Recognition solo en cliente
  useEffect(() => {
    setIsClient(true);
    const isSupported = typeof window !== 'undefined' && 
                       ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setSpeechSupported(isSupported);
  }, []);

  // Hook de wake word
  const { 
    listening: wakeListening, 
    loading: wakeLoading, 
    error: wakeError,
    isReady: wakeReady,
    start: startWakeWord, 
    stop: stopWakeWord
  } = useReactSpeechWakeWord({
    wakeWords: [
      'jarvis', 
      'hey jarvis', 
      'ok jarvis', 
      'oye jarvis'
    ],
    language: 'es-ES',
    onWake: () => {
      if (isActivatingRef.current || connected || connecting) {
        return;
      }
      
      isActivatingRef.current = true;
      
      if (activationTimeoutRef.current) {
        clearTimeout(activationTimeoutRef.current);
      }
      
      connect()
        .then(() => {
          console.log('🚀 JARVIS activado');
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

  const reactivateWakeWord = useCallback(() => {
    if (wakeReady && !wakeListening && !connected && !connecting && !isActivatingRef.current) {
      startWakeWord();
    }
  }, [startWakeWord, wakeReady, wakeListening, connected, connecting]);

  useEffect(() => {
    setAutoSleepCallback(reactivateWakeWord);
  }, [setAutoSleepCallback, reactivateWakeWord]);

  // Orquestación optimizada solo cuando estamos en cliente
  useEffect(() => {
    if (!isClient || speechSupported === null) return;
    
    if (!speechSupported) {
      return;
    }

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
    wakeReady, 
    connected, 
    connecting, 
    wakeListening, 
    wakeLoading, 
    startWakeWord, 
    stopWakeWord
  ]);

  const handleToggle = useCallback(() => {
    if (connecting || isActivatingRef.current) {
      return;
    }

    if (connected) {
      disconnect();
      setTimeout(() => {
        if (wakeReady && !wakeListening) {
          startWakeWord();
        }
      }, 100);
    } else {
      isActivatingRef.current = true;
      connect().finally(() => {
        isActivatingRef.current = false;
      });
    }
  }, [connected, connecting, wakeListening, wakeReady, disconnect, startWakeWord, connect]);

  useEffect(() => {
    return () => {
      if (activationTimeoutRef.current) {
        clearTimeout(activationTimeoutRef.current);
      }
      isActivatingRef.current = false;
    };
  }, []);

  // Loading state
  if (!isClient || speechSupported === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-8"></div>
            
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-cyan-300/50 rounded-full animate-spin mx-auto" style={{animationDuration: '1.5s', animationDirection: 'reverse'}}></div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            Inicializando J.A.R.V.I.S.
          </h2>
          
          <p className="text-cyan-400 text-lg">
            Verificando sistemas...
          </p>
        </div>
      </div>
    );
  }

  // Pantalla para navegadores no compatibles
  if (!speechSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center p-6">
        <div className="max-w-2xl bg-slate-800/50 backdrop-blur-sm border border-red-500/30 rounded-3xl p-8 text-center">
          <div className="text-6xl mb-6">⚠️</div>
          
          <h2 className="text-3xl font-bold text-red-400 mb-6">
            Navegador No Compatible
          </h2>
          
          <div className="text-left bg-slate-900/50 rounded-2xl p-6 mb-8">
            <h3 className="text-cyan-400 font-semibold mb-4 text-center">
              ✅ Navegadores Compatibles
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">●</span>
                  <span className="text-white">Google Chrome</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">●</span>
                  <span className="text-white">Microsoft Edge</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">●</span>
                  <span className="text-white">Safari</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">●</span>
                  <span className="text-white">Opera</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700">
              <h4 className="text-red-400 font-semibold mb-2">❌ No Compatible</h4>
              <p className="text-slate-400 text-sm">Firefox y navegadores antiguos</p>
            </div>
          </div>
          
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
          
          <p className="text-slate-400 text-sm mt-4">
            Sin wake word, usa el botón para activar
          </p>
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
    />
  );
}