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
  // Estado para efectos de transición suaves
  const [previousStatus, setPreviousStatus] = useState(status);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
  const cls = [
    styles.diamondBtn,
    connected ? styles.connected : '',
    status === 'connecting' ? styles.connecting : '',
    status === 'listening' ? styles.listening : '',
    status === 'speaking' ? styles.speaking : '',
    status === 'wake-listening' || (wakeListening && !connected) ? styles.wakeListening : '',
    isTransitioning ? styles.transitioning : ''
  ].filter(Boolean).join(' ');

  const getStatusText = () => {
    if (wakeError) return `ERROR: ${wakeError}`;
    
    switch (status) {
      case 'connecting': return 'INICIALIZANDO SISTEMAS...';
      case 'listening': return 'J.A.R.V.I.S. ESCUCHANDO...';
      case 'speaking': return 'J.A.R.V.I.S. RESPONDIENDO...';
      case 'wake-listening': return 'DI "JARVIS" PARA ACTIVAR';
      case 'idle': 
        if (connected) return 'J.A.R.V.I.S. ONLINE';
        if (wakeListening) return 'DI "JARVIS" PARA ACTIVAR';
        return 'SISTEMA EN ESPERA';
      default: return 'SISTEMA LISTO';
    }
  };

  const getSystemName = () => {
    if (wakeError) return 'ERROR';
    
    switch (status) {
      case 'listening': return 'J.A.R.V.I.S.';
      case 'speaking': return 'J.A.R.V.I.S.';
      case 'wake-listening': return 'WAKE WORD';
      default: 
        if (connected) return 'J.A.R.V.I.S.';
        if (wakeListening) return 'WAKE WORD';
        return 'SISTEMA';
    }
  };

  const getAriaLabel = () => {
    if (wakeListening && !connected) return 'Wake word activo - Di "Jarvis" para activar';
    if (connected) return 'Desconectar JARVIS';
    return 'Activar JARVIS manualmente';
  };

  return (
    <div className={styles.wrap}>
      {/* Indicador de sistema activo */}
      <div className={styles.systemName}>
        {getSystemName()}
      </div>

      {/* Botón principal */}
      <button
        onClick={onToggle}
        disabled={connecting}
        className={cls}
        aria-pressed={connected}
        aria-label={getAriaLabel()}
        title={getAriaLabel()}
      >
        {/* Indicador de estado interno */}
        <div className={styles.innerCore}>
          <div className={styles.pulseCenter}></div>
        </div>
      </button>

      {/* Status text */}
      <div className={`${styles.status} ${wakeError ? styles.error : ''}`}>
        {getStatusText()}
      </div>

      {/* Indicadores de actividad */}
      <div className={styles.activityIndicators}>
        <div className={`${styles.indicator} ${styles.micIndicator} ${
          status === 'listening' || status === 'wake-listening' || wakeListening ? styles.active : ''
        }`}>
          <span>🎤</span>
        </div>
        <div className={`${styles.indicator} ${styles.speakerIndicator} ${
          status === 'speaking' ? styles.active : ''
        }`}>
          <span>🔊</span>
        </div>
        <div className={`${styles.indicator} ${styles.wakeIndicator} ${
          wakeListening && !connected ? styles.active : ''
        }`}>
          <span>👂</span>
        </div>
      </div>

      {/* Instrucciones de wake word */}
      {wakeListening && !connected && !wakeError && (
        <div className={styles.wakeInstructions}>
          <div className={styles.wakeText}>
            Di <strong>"Jarvis"</strong> para activar
          </div>
        </div>
      )}

      {children}
    </div>
  );
}