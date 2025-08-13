'use client';

import AgentShell from '../components/AgentUI/AgentShell';
import { useRealtimeAgent } from '../hooks/useRealtimeAgent';
export default function AgentPage() {
  const { connected, connecting, status, toggle } = useRealtimeAgent();

  return (
    <AgentShell
      connected={connected}
      connecting={connecting}
      status={status}
      onToggle={toggle}
    />
  );
}
