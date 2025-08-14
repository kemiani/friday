// src/app/lib/agent/realtime.ts
// Librería realtime actualizada con configuración personalizada - COMPLETAMENTE CORREGIDA

import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import { generateSessionConfig, generateUserActivityLog, canUserAccessFeature, type FeatureType } from './config';
import type { User } from '@/app/types/db';

export type SessionStatus = 'idle'|'connecting'|'listening'|'speaking';

export interface CreateSessionOptions {
  instructions?: string;
  user?: User | null;
  onUserActivity?: (log: Record<string, unknown>) => void;
}

// Helper para convertir cualquier objeto en Record<string, unknown>
function asRecord(obj: unknown): Record<string, unknown> {
  return obj as Record<string, unknown>;
}

export async function createAndConnectSession(
  opts: CreateSessionOptions = {}
): Promise<RealtimeSession> {
  const { instructions, user = null, onUserActivity } = opts;

  if (onUserActivity && user) {
    onUserActivity(generateUserActivityLog(user, 'session_create_started'));
  }

  try {
    // 1) Obtener token efímero del backend
    const res = await fetch('/api/realtime/session', { cache: 'no-store' });
    const data = await res.json();
    const apiKey: string | undefined = data?.apiKey;
    
    if (!apiKey) {
      throw new Error('No ephemeral apiKey received');
    }

    console.log(`🔑 Token obtenido para usuario: ${user?.name || 'Anónimo'}`);

    // 2) Generar configuración personalizada
    const sessionConfig = generateSessionConfig(user);
    const finalInstructions = instructions || sessionConfig.instructions;

    console.log(`👤 Configurando sesión para ${user?.name || 'usuario anónimo'} (${user?.tier || 'free'})`);

    // 3) Crear agente con configuración personalizada
    const agent = new RealtimeAgent({
      name: `JARVIS-${user?.name || 'Anonymous'}`,
      instructions: finalInstructions,
    });

    // 4) Crear sesión
    const session = new RealtimeSession(agent);

    // 5) Agregar metadata de usuario a la sesión
    if (user) {
      asRecord(session).userContext = {
        id: user.id,
        name: user.name,
        tier: user.tier,
        auth_method: user.auth_method,
        email: user.email,
        created_at: user.created_at
      };
    }

    // 6) Conectar
    await session.connect({ apiKey });

    console.log(`✅ Sesión conectada para ${user?.name || 'usuario anónimo'}`);

    if (onUserActivity && user) {
      onUserActivity(generateUserActivityLog(user, 'session_connected'));
    }

    return session;

  } catch (error) {
    console.error('❌ Error creando sesión:', error);

    if (onUserActivity && user) {
      onUserActivity(generateUserActivityLog(user, 'session_create_failed'));
    }

    throw error;
  }
}

// Actualizar contexto de usuario
export function updateSessionUserContext(session: RealtimeSession, user: User) {
  try {
    asRecord(session).userContext = {
      id: user.id,
      name: user.name,
      tier: user.tier,
      auth_method: user.auth_method,
      email: user.email,
      updated_at: new Date().toISOString()
    };
    console.log(`🔄 Contexto de usuario actualizado en sesión: ${user.name}`);
  } catch (error) {
    console.error('❌ Error actualizando contexto de usuario:', error);
  }
}

// Obtener información de la sesión
export function getSessionInfo(session: RealtimeSession) {
  const userContext = asRecord(session).userContext;
  
  return {
    isAuthenticated: !!userContext,
    user: userContext || null,
    sessionId: asRecord(session).id || 'unknown',
    connectedAt: asRecord(session).connectedAt || new Date().toISOString()
  };
}

// Enviar mensaje personalizado
export async function sendPersonalizedMessage(
  session: RealtimeSession, 
  message: string, 
  user?: User | null
) {
  try {
    const personalizedMessage = user?.name 
      ? `${message} (Usuario: ${user.name})`
      : message;

    await session.sendMessage({
      type: 'message' as const,
      role: 'user' as const,
      content: [
        {
          type: 'input_text' as const,
          text: personalizedMessage
        }
      ]
    });

    console.log(`📤 Mensaje personalizado enviado para ${user?.name || 'usuario anónimo'}`);
  } catch (error) {
    console.error('❌ Error enviando mensaje personalizado:', error);
    throw error;
  }
}

// Verificar límites de usuario
export function checkUserLimits(user: User | null): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Usuario no autenticado' };
  }
  return { allowed: true };
}

// Limpiar sesión
export function cleanupSession(session: RealtimeSession, user?: User | null) {
  try {
    console.log(`🧹 Limpiando sesión para ${user?.name || 'usuario anónimo'}`);
    delete asRecord(session).userContext;
    session.close();
    console.log('✅ Sesión limpiada correctamente');
  } catch (error) {
    console.error('❌ Error limpiando sesión:', error);
  }
}

// Verificar características por usuario
export function checkUserFeature(user: User | null, feature: FeatureType): boolean {
  if (!user) return false;
  return canUserAccessFeature(user, feature);
}
