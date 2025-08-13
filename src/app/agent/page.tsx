'use client';

import { useEffect, useCallback } from 'react';
import AgentShell from '../components/AgentUI/AgentShell';
import { useRealtimeAgent } from '../hooks/useRealtimeAgent';
import useReactSpeechWakeWord from '../hooks/useReactSpeechWakeWord'; // CAMBIO: import por defecto

export default function AgentPage() {
  const { 
    connected, 
    connecting, 
    status, 
    connect, 
    disconnect, 
    setAutoSleepCallback 
  } = useRealtimeAgent();

  // Hook de wake word con Web Speech API (¡GRATIS!)
  const { 
    listening: wakeListening, 
    loading: wakeLoading, 
    error: wakeError,
    isReady: wakeReady,
    start: startWakeWord, 
    stop: stopWakeWord,
    isSupported: speechSupported
  } = useReactSpeechWakeWord({
    wakeWords: ['jarvis', 'hey jarvis', 'ok jarvis', 'oye jarvis'],
    language: 'es-ES', // Cambia a 'en-US' si prefieres inglés
    onWake: () => {
      console.log('🎯 Wake word detectado! Activando JARVIS...');
      connect();
    },
    onError: (error: Error) => {
      console.error('❌ Error en wake word:', error);
    }
  });

  // Función para reactivar wake word (usada en auto-sleep)
  const reactivateWakeWord = useCallback(() => {
    console.log('🔄 Reactivando wake word después de auto-sleep...');
    if (wakeReady && !wakeListening) {
      setTimeout(() => startWakeWord(), 1000);
    }
  }, [startWakeWord, wakeReady, wakeListening]);

  // Configurar callback de auto-sleep
  useEffect(() => {
    setAutoSleepCallback(reactivateWakeWord);
  }, [setAutoSleepCallback, reactivateWakeWord]);

  // Lógica de orquestación: wake word ↔ conversación
  useEffect(() => {
    if (!speechSupported) {
      console.error('❌ Speech Recognition no soportado en este navegador');
      return;
    }

    // Si está listo y no estoy conectado ni escuchando, activar wake word
    if (wakeReady && !connected && !connecting && !wakeListening && !wakeLoading) {
      console.log('🔊 Iniciando wake word listener...');
      startWakeWord();
    }

    // Si me conecto, detener wake word
    if (connected && wakeListening) {
      console.log('🛑 Deteniendo wake word (conectado a Realtime)');
      stopWakeWord();
    }

  }, [wakeReady, connected, connecting, wakeListening, wakeLoading, startWakeWord, stopWakeWord, speechSupported]);

  // Función de toggle manual
  const handleToggle = useCallback(() => {
    if (connected) {
      // Si estoy conectado, desconectar y reactivar wake word
      disconnect();
      setTimeout(() => {
        if (wakeReady) startWakeWord();
      }, 500);
    } else if (!wakeListening && wakeReady) {
      // Si no estoy escuchando wake word y está listo, conectar directamente
      connect();
    }
  }, [connected, wakeListening, wakeReady, disconnect, startWakeWord, connect]);

  // Pantalla de configuración si no hay Speech Recognition
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
              onClick={() => connect()}
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

  return (
    <AgentShell
      connected={connected}
      connecting={connecting}
      status={status}
      onToggle={handleToggle}
      wakeListening={wakeListening}
      wakeError={wakeError}
    >
      {/* Debug info en desarrollo */}
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
          minWidth: '200px'
        }}>
          <div><strong>🤖 JARVIS DEBUG</strong></div>
          <div>Connected: {connected ? '✅' : '❌'}</div>
          <div>Status: <span style={{color: '#ffff00'}}>{status}</span></div>
          <div>Speech Support: {speechSupported ? '✅' : '❌'}</div>
          <div>Wake Ready: {wakeReady ? '✅' : '❌'}</div>
          <div>Wake Listening: {wakeListening ? '👂' : '🔇'}</div>
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