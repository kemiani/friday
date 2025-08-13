'use client';

import { useEffect, useCallback } from 'react';
import AgentShell from '../components/AgentUI/AgentShell';
import { useRealtimeAgent } from '../hooks/useRealtimeAgent';
import { useWakeWord } from '../hooks/useWakeWord';

const PICOVOICE_ACCESS_KEY = process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY;

export default function AgentPage() {
  const { 
    connected, 
    connecting, 
    status, 
    connect, 
    disconnect, 
    setAutoSleepCallback 
  } = useRealtimeAgent();

  // Hook de wake word con Porcupine React
  const { 
    listening: wakeListening, 
    loading: wakeLoading, 
    error: wakeError,
    isReady: wakeReady,
    start: startWakeWord, 
    stop: stopWakeWord 
  } = useWakeWord({
    accessKey: PICOVOICE_ACCESS_KEY || '',
    keywordPath: '/keywords/jarvis.ppn',
    onWake: () => {
      console.log('🎯 Wake word detectado! Activando JARVIS...');
      connect();
    },
    onError: (error) => {
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
    if (!PICOVOICE_ACCESS_KEY) {
      console.error('❌ NEXT_PUBLIC_PICOVOICE_ACCESS_KEY no configurado');
      return;
    }

    // Si Porcupine está listo y no estoy conectado ni escuchando, activar wake word
    if (wakeReady && !connected && !connecting && !wakeListening && !wakeLoading) {
      console.log('🔊 Iniciando wake word listener...');
      startWakeWord();
    }

    // Si me conecto, detener wake word
    if (connected && wakeListening) {
      console.log('🛑 Deteniendo wake word (conectado a Realtime)');
      stopWakeWord();
    }

  }, [wakeReady, connected, connecting, wakeListening, wakeLoading, startWakeWord, stopWakeWord]);

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

  // Pantalla de configuración si no hay access key
  if (!PICOVOICE_ACCESS_KEY) {
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
            ⚡ CONFIGURACIÓN REQUERIDA ⚡
          </h2>
          
          <div style={{ textAlign: 'left', marginBottom: '25px', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '20px', color: '#ffffff' }}>
              Para activar el wake word <strong>"Jarvis"</strong>, necesitas configurar Picovoice:
            </p>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '20px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              marginBottom: '20px',
              border: '1px solid rgba(255, 68, 68, 0.3)'
            }}>
              <strong style={{ color: '#66ccff' }}>📋 PASOS:</strong><br/><br/>
              
              <strong>1.</strong> Ve a{' '}
              <a href="https://console.picovoice.ai/" target="_blank" 
                 style={{color: '#66ccff', textDecoration: 'underline'}}>
                console.picovoice.ai
              </a><br/>
              
              <strong>2.</strong> Crea una cuenta gratuita<br/>
              
              <strong>3.</strong> Crea un proyecto wake word:<br/>
              {'   '}- Clic en "Wake Word" → "Create"<br/>
              {'   '}- Nombre: "Jarvis"<br/>
              {'   '}- Plataforma: "Web (WASM)"<br/>
              {'   '}- Graba 3-5 muestras diciendo "Jarvis"<br/>
              {'   '}- Entrena y descarga el .ppn<br/>
              
              <strong>4.</strong> Guarda el archivo como: <code style={{background: 'rgba(0,0,0,0.5)', padding: '2px 4px'}}>public/keywords/jarvis.ppn</code><br/>
              
              <strong>5.</strong> Copia tu Access Key y agrégala a .env.local:
            </div>
            
            <code style={{
              display: 'block',
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#00ff00',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              wordBreak: 'break-all'
            }}>
              NEXT_PUBLIC_PICOVOICE_ACCESS_KEY=tu_clave_aqui
            </code>
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
          <div>Wake Ready: {wakeReady ? '✅' : '❌'}</div>
          <div>Wake Listening: {wakeListening ? '👂' : '🔇'}</div>
          <div>Wake Loading: {wakeLoading ? '⏳' : '✅'}</div>
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