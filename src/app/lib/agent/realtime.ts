import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import { DEFAULT_INSTRUCTIONS } from './config';

export type SessionStatus = 'idle'|'connecting'|'listening'|'speaking';

export async function createAndConnectSession(
  opts?: { instructions?: string }
): Promise<RealtimeSession> {
  // 1) pedir token efímero a tu backend
  const res = await fetch('/api/realtime/session', { cache: 'no-store' });
  const data = await res.json();
  const apiKey: string | undefined = data?.apiKey;
  if (!apiKey) throw new Error('No ephemeral apiKey');

  // 2) crear agente y sesión
  const agent = new RealtimeAgent({
    name: 'Assistant',
    instructions: (opts?.instructions ?? DEFAULT_INSTRUCTIONS),
  });

  const session = new RealtimeSession(agent);

  // 3) conectar (browser: WebRTC; backend: WS)
  await session.connect({ apiKey });

  return session;
}
