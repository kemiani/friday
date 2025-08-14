// src/app/lib/agent/config.ts - Versión con contexto personalizado de usuario

import type { User } from "@/app/utils/supabase/supabase";

// NUEVO: Función para generar prompt personalizado por usuario
export function generatePersonalizedInstructions(user: User | null): string {
  const baseInstructions = `Eres JARVIS, asistente IA profesional y eficiente.`;
  
  if (!user) {
    return `${baseInstructions}

COMPORTAMIENTO:
- Al conectar di "Sí?" con tono de pregunta
- Respuestas concisas (máximo 2-3 oraciones)
- Tono profesional pero amigable`;
  }

  const userContext = `
CONTEXTO DEL USUARIO:
- Nombre: ${user.name || 'Usuario'}
- Email: ${user.email || 'No especificado'}
- Plan: ${user.tier?.toUpperCase() || 'FREE'}
- Método de autenticación: ${user.auth_method || 'wallet'}
- Usuario desde: ${new Date(user.created_at).toLocaleDateString('es-ES')}
- Última actividad: ${new Date(user.updated_at).toLocaleDateString('es-ES')}`;

  const personalizedBehavior = `
COMPORTAMIENTO PERSONALIZADO:
- SIEMPRE dirígete al usuario como "${user.name || 'Usuario'}"
- Al conectar di "Sí, ${user.name}?" o "¿En qué puedo ayudarte, ${user.name}?"
- Adapta tu nivel de formalidad: ${user.tier === 'free' ? 'amigable y accesible' : 'más profesional y detallado'}
- Recuerda que es usuario ${user.tier === 'free' ? 'gratuito (limita funciones premium)' : 'premium (acceso completo)'}
- Menciona su nombre ocasionalmente durante la conversación para mayor personalización`;

  const capabilities = `
CAPACIDADES SEGÚN PLAN:
${user.tier === 'free' ? `
- Conversaciones básicas (máximo 60 min/día)
- Consultas generales
- Funciones limitadas
` : `
- Conversaciones ilimitadas
- Funciones avanzadas de agente
- Integración completa con servicios
- Llamadas telefónicas
- Gestión de emails y calendario
`}`;

  return `${baseInstructions}

${userContext}

${personalizedBehavior}

${capabilities}

INSTRUCCIONES GENERALES:
- Respuestas concisas pero completas (máximo 3 oraciones)
- Si procesas algo: "Un momento, ${user.name}..."
- Mantén tono eficiente pero cálido y personalizado
- Usa el nombre del usuario para crear conexión personal`;
}

// NUEVO: Función para generar saludo inicial personalizado
export function generatePersonalizedGreeting(user: User | null): string {
  if (!user || !user.name) {
    return 'Sí?';
  }

  const timeOfDay = new Date().getHours();
  let timeGreeting = '';
  
  if (timeOfDay < 12) {
    timeGreeting = 'Buenos días';
  } else if (timeOfDay < 18) {
    timeGreeting = 'Buenas tardes';
  } else {
    timeGreeting = 'Buenas noches';
  }

  // Alternar entre diferentes saludos para variedad
  const greetings = [
    `${timeGreeting}, ${user.name}. ¿En qué puedo ayudarte?`,
    `Sí, ${user.name}?`,
    `Hola ${user.name}, ¿qué necesitas?`,
    `${timeGreeting}, ${user.name}. ¿Cómo puedo asistirte?`
  ];

  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex];
}

// Configuraciones específicas por tier de usuario
export const TIER_CONFIGURATIONS = {
  free: {
    maxTokensPerResponse: 100,
    temperature: 0.7,
    features: ['basic_conversation', 'simple_queries'],
    limitations: {
      dailyMinutes: 60,
      monthlyInteractions: 100,
      voiceCalls: false,
      emailIntegration: false
    }
  },
  pro: {
    maxTokensPerResponse: 200,
    temperature: 0.8,
    features: ['basic_conversation', 'advanced_queries', 'voice_calls', 'email_basic'],
    limitations: {
      dailyMinutes: 300,
      monthlyInteractions: 1000,
      voiceCalls: true,
      emailIntegration: true
    }
  },
  business: {
    maxTokensPerResponse: 300,
    temperature: 0.9,
    features: ['all_features'],
    limitations: {
      dailyMinutes: -1, // Unlimited
      monthlyInteractions: -1, // Unlimited
      voiceCalls: true,
      emailIntegration: true
    }
  }
} as const;

// NUEVO: Función para obtener configuración según el tier del usuario
export function getTierConfiguration(userTier: string = 'free') {
  return TIER_CONFIGURATIONS[userTier as keyof typeof TIER_CONFIGURATIONS] || TIER_CONFIGURATIONS.free;
}

// Configuración de voz optimizada para respuesta personalizada
export const VOICE_CONFIG = {
  voice: 'alloy',
  turn_detection: {
    type: 'server_vad' as const,
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 400
  }
};

// Auto-sleep optimizado
export const AUTO_SLEEP_CONFIG = {
  timeoutMs: 15_000,
  warningMs: 12_000,
};

// ACTUALIZADO: Función para generar configuración completa de sesión
export function generateSessionConfig(user: User | null) {
  const tierConfig = getTierConfiguration(user?.tier);
  
  return {
    model: 'gpt-4o-mini-realtime-preview',
    modalities: ['text', 'audio'],
    instructions: generatePersonalizedInstructions(user),
    voice: VOICE_CONFIG.voice,
    turn_detection: VOICE_CONFIG.turn_detection,
    input_audio_format: 'pcm16',
    output_audio_format: 'pcm16',
    input_audio_transcription: {
      model: 'whisper-1'
    },
    temperature: tierConfig.temperature,
    max_response_output_tokens: tierConfig.maxTokensPerResponse
  };
}

// Wake word simplificado
export const WAKE_WORD_CONFIG = {
  words: ['jarvis', 'hey jarvis'],
  language: 'es-ES',
  continuous: true,
  interimResults: false
};

// NUEVO: Función para verificar si el usuario puede usar una función
export function canUserAccessFeature(user: User | null, feature: string): boolean {
  if (!user) return false;
  
  const tierConfig = getTierConfiguration(user.tier);
  
  if (tierConfig.features.includes('all_features')) {
    return true;
  }
  
  return tierConfig.features.includes(feature);
}

// NUEVO: Función para obtener mensaje de limitación
export function getLimitationMessage(user: User | null, feature: string): string {
  if (!user) return 'Necesitas estar autenticado para usar esta función.';
  
  const tierConfig = getTierConfiguration(user.tier);
  
  if (canUserAccessFeature(user, feature)) {
    return '';
  }
  
  const upgradeMessages = {
    voice_calls: `${user.name}, las llamadas de voz están disponibles en el plan Pro. ¿Te gustaría saber más sobre la actualización?`,
    email_integration: `${user.name}, la integración con email está disponible en el plan Pro. ¿Quieres que te explique los beneficios?`,
    advanced_queries: `${user.name}, consultas avanzadas requieren plan Pro. Tu plan actual incluye conversaciones básicas.`
  };
  
  return upgradeMessages[feature as keyof typeof upgradeMessages] || 
         `${user.name}, esta función requiere un plan superior. ¿Te interesa conocer las opciones de actualización?`;
}

// NUEVO: Configuración para logging personalizado
export function generateUserActivityLog(user: User | null, action: string) {
  return {
    user_id: user?.id || 'anonymous',
    user_name: user?.name || 'Anonymous',
    user_tier: user?.tier || 'unknown',
    action,
    timestamp: new Date().toISOString(),
    session_context: {
      auth_method: user?.auth_method,
      last_active: user?.updated_at
    }
  };
}