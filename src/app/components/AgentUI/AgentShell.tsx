'use client';

import { useEffect, useState } from 'react';
import styles from './AgentShell.module.css';

export type AgentShellProps = {
  connected: boolean;
  connecting: boolean;
  status: 'idle'|'connecting'|'listening'|'speaking'|'wake-listening';
  onToggle: () => void;
  wakeListening?: boolean;
  wakeError?: string | null;
  children?: React.ReactNode;
};

export default function AgentShell({
  connected,
  connecting,
  status,
  onToggle,
  wakeListening = false,
  wakeError = null,
  children
}: AgentShellProps) {
  const [isClient, setIsClient] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(status);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Detectar que estamos en cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Detectar cambios de estado para animaciones de transición
  useEffect(() => {
    if (status !== previousStatus) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousStatus(status);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status, previousStatus]);

  // Clases dinámicas del botón
  const buttonClasses = [
    styles.diamondBtn,
    connected ? styles.connected : '',
    status === 'connecting' ? styles.connecting : '',
    status === 'listening' ? styles.listening : '',
    status === 'speaking' ? styles.speaking : '',
    status === 'wake-listening' || (wakeListening && !connected) ? styles.wakeListening : '',
    isTransitioning ? styles.transitioning : ''
  ].filter(Boolean).join(' ');

  const getStatusText = () => {
    if (!isClient) return 'Inicializando sistemas...';
    
    if (wakeError) return `Error: ${wakeError}`;
    
    switch (status) {
      case 'connecting': return 'Inicializando sistemas...';
      case 'listening': return 'J.A.R.V.I.S. escuchando';
      case 'speaking': return 'J.A.R.V.I.S. respondiendo';
      case 'wake-listening': return 'Esperando comando de activación';
      case 'idle': 
        if (connected) return 'J.A.R.V.I.S. online';
        if (wakeListening) return 'Esperando comando de activación';
        return 'Sistema en espera';
      default: return 'Sistema listo';
    }
  };

  const getSystemName = () => {
    if (!isClient) return 'SISTEMA';
    
    if (wakeError) return 'ERROR';
    
    switch (status) {
      case 'listening': 
      case 'speaking': 
        return 'J.A.R.V.I.S.';
      case 'wake-listening': 
        return 'WAKE SYSTEM';
      default: 
        if (connected) return 'J.A.R.V.I.S.';
        if (wakeListening) return 'WAKE SYSTEM';
        return 'SISTEMA';
    }
  };

  const getAriaLabel = () => {
    if (!isClient) return 'Inicializando sistema';
    if (wakeListening && !connected) return 'Sistema de activación por voz activo';
    if (connected) return 'Desconectar JARVIS';
    return 'Activar JARVIS';
  };

  const isListening = status === 'listening' || status === 'wake-listening' || wakeListening;
  const isSpeaking = status === 'speaking';
  const isWakeActive = wakeListening && !connected;

  return (
    <div className={styles.wrap}>
      {/* Nombre del sistema */}
      <div className={styles.systemName}>
        {getSystemName()}
      </div>

      {/* Botón principal */}
      <button
        onClick={onToggle}
        disabled={connecting || !isClient}
        className={buttonClasses}
        aria-pressed={connected}
        aria-label={getAriaLabel()}
        title={getAriaLabel()}
      >
        <div className={styles.innerCore}>
          <div className={styles.pulseCenter}></div>
        </div>
      </button>

      {/* Status text */}
      <div className={`${styles.status} ${wakeError ? styles.error : ''}`}>
        {getStatusText()}
      </div>

      {/* Indicadores de actividad */}
      {isClient && (
        <div className={styles.activityIndicators}>
          {/* Indicador de micrófono */}
          <div 
            className={`${styles.indicator} ${styles.micIndicator} ${isListening ? styles.active : ''}`}
            title="Micrófono"
          >
            <span>🎤</span>
          </div>
          
          {/* Indicador de altavoz */}
          <div 
            className={`${styles.indicator} ${styles.speakerIndicator} ${isSpeaking ? styles.active : ''}`}
            title="Altavoz"
          >
            <span>🔊</span>
          </div>
          
          {/* Indicador de wake word */}
          <div 
            className={`${styles.indicator} ${styles.wakeIndicator} ${isWakeActive ? styles.active : ''}`}
            title="Sistema de activación por voz"
          >
            <span>👂</span>
          </div>
        </div>
      )}

      {/* Instrucciones de wake word - FIXED: Usar entidades HTML para comillas */}
      {isClient && isWakeActive && !wakeError && (
        <div className={styles.wakeInstructions}>
          <div className={styles.wakeText}>
            Di <strong>&ldquo;Jarvis&rdquo;</strong> para activar
          </div>
        </div>
      )}

      {children}
    </div>
  );
}