// src/app/lib/agent/realtime.ts
// Librería realtime actualizada con configuración personalizada

import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import { generateSessionConfig, generateUserActivityLog } from './config';
import type { User } from '@/app/utils/supabase/supabase';

export type SessionStatus = 'idle'|'connecting'|'listening'|'speaking';

export interface CreateSessionOptions {
  instructions?: string;
  user?: User | null;
  onUserActivity?: (log: any) => void;
}

export async function createAndConnectSession(
  opts: CreateSessionOptions = {}
): Promise<RealtimeSession> {
  const { instructions, user, onUserActivity } = opts;

  // Log de actividad del usuario
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
    
    // Usar instrucciones personalizadas o las generadas automáticamente
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
      (session as any).userContext = {
        id: user.id,
        name: user.name,
        tier: user.tier,
        auth_method: user.auth_method,
        email: user.email,
        created_at: user.created_at
      };
    }

    // 6) Conectar (browser: WebRTC; backend: WS)
    await session.connect({ apiKey });

    console.log(`✅ Sesión conectada para ${user?.name || 'usuario anónimo'}`);

    // Log de conexión exitosa
    if (onUserActivity && user) {
      onUserActivity(generateUserActivityLog(user, 'session_connected'));
    }

    return session;

  } catch (error) {
    console.error('❌ Error creando sesión:', error);

    // Log de error
    if (onUserActivity && user) {
      onUserActivity(generateUserActivityLog(user, 'session_create_failed'));
    }

    throw error;
  }
}

// NUEVO: Función para actualizar el contexto de usuario en sesión activa
export function updateSessionUserContext(session: RealtimeSession, user: User) {
  try {
    (session as any).userContext = {
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

// NUEVO: Función para obtener información de la sesión
export function getSessionInfo(session: RealtimeSession) {
  const userContext = (session as any).userContext;
  
  return {
    isAuthenticated: !!userContext,
    user: userContext || null,
    sessionId: (session as any).id || 'unknown',
    connectedAt: (session as any).connectedAt || new Date().toISOString()
  };
}

// NUEVO: Función para enviar mensaje personalizado con contexto
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
      type: 'message',
      role: 'user',
      content: [
        {
          type: 'input_text',
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

// NUEVO: Función para verificar límites de usuario antes de crear sesión
export function checkUserLimits(user: User | null): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Usuario no autenticado' };
  }

  // Aquí puedes agregar lógica para verificar límites desde la base de datos
  // Por ahora, permitir todos los usuarios autenticados
  return { allowed: true };
}

// NUEVO: Función para cleanup seguro de sesión
export function cleanupSession(session: RealtimeSession, user?: User | null) {
  try {
    console.log(`🧹 Limpiando sesión para ${user?.name || 'usuario anónimo'}`);
    
    // Limpiar contexto de usuario
    delete (session as any).userContext;
    
    // Cerrar sesión
    session.close();
    
    console.log('✅ Sesión limpiada correctamente');
  } catch (error) {
    console.error('❌ Error limpiando sesión:', error);
  }
}