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

  // SOLUCIÓN HIDRATACIÓN: Estado para detectar que estamos en cliente
  const [isClient, setIsClient] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);

  // Referencias para evitar activaciones duplicadas
  const isActivatingRef = useRef(false);
  const activationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // OPTIMIZACIÓN: Detectar soporte de Speech Recognition solo en cliente
  useEffect(() => {
    setIsClient(true);
    // Detectar soporte real de Speech Recognition
    const isSupported = typeof window !== 'undefined' && 
                       ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setSpeechSupported(isSupported);
  }, []);

  // Hook de wake word con configuración ultra-responsiva
  const { 
    listening: wakeListening, 
    loading: wakeLoading, 
    error: wakeError,
    isReady: wakeReady,
    start: startWakeWord, 
    stop: stopWakeWord,
    isSupported: hookSpeechSupported
  } = useReactSpeechWakeWord({
    wakeWords: [
      'jarvis', 
      'hey jarvis', 
      'ok jarvis', 
      'oye jarvis'
    ],
    language: 'es-ES',
    onWake: () => {
      console.log('🎯 ¡WAKE WORD DETECTADO INSTANTÁNEAMENTE!');
      
      if (isActivatingRef.current || connected || connecting) {
        console.log('⚠️ Activación ignorada - ya en proceso');
        return;
      }
      
      isActivatingRef.current = true;
      
      if (activationTimeoutRef.current) {
        clearTimeout(activationTimeoutRef.current);
      }
      
      connect()
        .then(() => {
          console.log('🚀 JARVIS activado y listo');
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
    console.log('🔄 Reactivando wake word RÁPIDAMENTE...');
    
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
      console.error('❌ Speech Recognition no soportado');
      return;
    }

    if (!connected && !connecting && !isActivatingRef.current) {
      if (wakeReady && !wakeListening && !wakeLoading) {
        console.log('🔊 Iniciando wake word listener INMEDIATAMENTE...');
        startWakeWord();
      }
    }

    if (connected && wakeListening) {
      console.log('🛑 Deteniendo wake word (JARVIS conectado)');
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
      console.log('⚠️ Toggle ignorado - ya en transición');
      return;
    }

    if (connected) {
      console.log('🔴 Desconectando manualmente...');
      disconnect();
      setTimeout(() => {
        if (wakeReady && !wakeListening) {
          startWakeWord();
        }
      }, 100);
    } else {
      console.log('🟢 Activando manualmente...');
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

  // SOLUCIÓN HIDRATACIÓN: Mostrar loading hasta que estemos en cliente
  if (!isClient || speechSupported === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #000204 0%, #000000 100%)',
        color: '#00ffff',
        fontFamily: 'monospace',
        fontSize: '1.2rem'
      }}>
        <div style={{
          background: 'rgba(0, 20, 40, 0.95)',
          border: '2px solid rgba(0, 255, 255, 0.6)',
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(0, 255, 255, 0.3)',
            borderTop: '4px solid #00ffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          
          <div style={{ color: '#ffffff', marginBottom: '10px' }}>
            <strong>INICIALIZANDO J.A.R.V.I.S.</strong>
          </div>
          
          <div style={{ color: '#00ffff', fontSize: '0.9rem' }}>
            Verificando compatibilidad del navegador...
          </div>
          
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Pantalla para navegadores no compatibles
  if (!speechSupported) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #000204 0%, #000000 100%)',
        color: '#ff4444',
        fontFamily: 'monospace',
        fontSize: '1.1rem',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(0, 20, 40, 0.95)',
          border: '2px solid rgba(255, 68, 68, 0.6)',
          borderRadius: '15px',
          padding: '40px',
          maxWidth: '600px',
          boxShadow: '0 0 40px rgba(255, 68, 68, 0.3)'
        }}>
          <h2 style={{ marginBottom: '25px', color: '#ff6666', fontSize: '1.8rem' }}>
            ⚠️ NAVEGADOR NO COMPATIBLE ⚠️
          </h2>
          
          <div style={{ textAlign: 'left', marginBottom: '25px', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '20px', color: '#ffffff' }}>
              Tu navegador no soporta <strong>Speech Recognition</strong> para wake words.
            </p>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '20px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              marginBottom: '20px',
              border: '1px solid rgba(255, 68, 68, 0.3)'
            }}>
              <strong style={{ color: '#66ccff' }}>✅ NAVEGADORES COMPATIBLES:</strong><br/><br/>
              
              <strong>• Google Chrome</strong> (recomendado)<br/>
              <strong>• Microsoft Edge</strong><br/>
              <strong>• Safari</strong> (macOS/iOS)<br/>
              <strong>• Opera</strong><br/><br/>
              
              <strong style={{ color: '#ff6666' }}>❌ NO COMPATIBLE:</strong><br/>
              <strong>• Firefox</strong> (no soporta Speech Recognition)<br/>
              <strong>• Navegadores antiguos</strong>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => {
                isActivatingRef.current = true;
                connect().finally(() => {
                  isActivatingRef.current = false;
                });
              }}
              style={{
                padding: '15px 30px',
                background: 'linear-gradient(45deg, #0066cc, #0099ff)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(0, 153, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 153, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 153, 255, 0.3)';
              }}
            >
              🎤 Activar JARVIS Manualmente
            </button>
          </div>
          
          <p style={{fontSize: '0.8rem', opacity: 0.8, color: '#cccccc'}}>
            Sin wake word puedes usar el botón manual para activar JARVIS
          </p>
        </div>
      </div>
    );
  }

  // Render principal - solo cuando todo está listo
  return (
    <AgentShell
      connected={connected}
      connecting={connecting}
      status={status}
      onToggle={handleToggle}
      wakeListening={wakeListening}
      wakeError={wakeError}
    >
      {/* Debug info optimizado para desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.9)',
          color: '#00ff00',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          minWidth: '220px'
        }}>
          <div><strong>🚀 JARVIS OPTIMIZADO</strong></div>
          <div>Client: {isClient ? '✅' : '❌'}</div>
          <div>Connected: {connected ? '✅' : '❌'}</div>
          <div>Connecting: {connecting ? '🔄' : '❌'}</div>
          <div>Status: <span style={{color: '#ffff00'}}>{status}</span></div>
          <div>Speech Support: {speechSupported ? '✅' : '❌'}</div>
          <div>Wake Ready: {wakeReady ? '✅' : '❌'}</div>
          <div>Wake Listening: {wakeListening ? '👂' : '🔇'}</div>
          <div>Activating: {isActivatingRef.current ? '🔄' : '❌'}</div>
          <div>Performance: <span style={{color: '#00ffff'}}>OPTIMIZED</span></div>
          {wakeError && (
            <div style={{color: '#ff4444', marginTop: '5px'}}>
              <strong>Error:</strong><br/>
              {wakeError}
            </div>
          )}
        </div>
      )}
    </AgentShell>
  );
}