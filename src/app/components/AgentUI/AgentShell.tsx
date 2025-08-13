'use client';

import styles from './AgentShell.module.css';

export type AgentShellProps = {
  connected: boolean;
  connecting: boolean;
  status: 'idle'|'connecting'|'listening'|'speaking';
  onToggle: () => void;
  children?: React.ReactNode;
};

export default function AgentShell({
  connected,
  connecting,
  status,
  onToggle,
  children
}: AgentShellProps) {
  const cls = [
    styles.diamondBtn,
    connected ? styles.connected : '',
    status === 'listening' ? styles.listening : '',
    status === 'speaking' ? styles.speaking : ''
  ].filter(Boolean).join(' ');

  const getStatusText = () => {
    switch (status) {
      case 'connecting': return 'Inicializando sistemas...';
      case 'listening': return 'Analizando entrada de voz...';
      case 'speaking': return 'Procesando respuesta...';
      case 'idle': return connected ? 'J.A.R.V.I.S. Online' : 'Sistema en espera';
      default: return 'Sistema listo';
    }
  };

  return (
    <div className={styles.wrap}>
      <button
        onClick={onToggle}
        disabled={connecting}
        className={cls}
        aria-pressed={connected}
        aria-label={connected ? 'Desconectar JARVIS' : 'Activar JARVIS'}
        title={connected ? 'Desconectar JARVIS' : 'Activar JARVIS'}
      />
      <div className={styles.status}>
        {getStatusText()}
      </div>

      {children}
    </div>
  );
}