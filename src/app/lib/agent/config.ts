// src/app/lib/agent/config.ts - Versión con respuesta inmediata "Sí?"

// NUEVO: Prompt específico para respuesta inmediata
export const IMMEDIATE_RESPONSE_INSTRUCTIONS = `Eres JARVIS, asistente IA. 

COMPORTAMIENTO AL CONECTAR:
- Inmediatamente di "Sí?" con tono de pregunta
- NO agregues explicaciones ni saludos largos
- Solo "Sí?" y espera mi instrucción

DURANTE LA CONVERSACIÓN:
- Respuestas concisas (máximo 2-3 oraciones)
- Tono profesional pero amigable
- Si procesas: "Un momento..."`.trim();

// Prompt ultra-optimizado para ahorrar tokens (modo mínimo)
export const OPTIMIZED_INSTRUCTIONS = `Eres JARVIS. Al conectar di "Sí?". Responde conciso y profesional.`.trim();

// Prompt completo para casos que requieren más contexto (opcional)
export const DETAILED_INSTRUCTIONS = `
Eres JARVIS, asistente IA de Tony Stark.

PERSONALIDAD: Inteligente, eficiente, profesional pero amigable.

COMPORTAMIENTO:
- Al conectar: di únicamente "Sí?" con tono de pregunta
- Respuestas concisas (máximo 2-3 oraciones)
- Si procesas: "Un momento..."
- Tono profesional pero cálido

CONTEXTO: Asistente de voz tiempo real, confidente inteligente.
`.trim();

// Configuraciones por contexto
export const INSTRUCTION_MODES = {
  // Ultra corto para activación inicial y respuestas simples
  MINIMAL: OPTIMIZED_INSTRUCTIONS,
  
  // NUEVO: Modo específico para respuesta inmediata
  IMMEDIATE: IMMEDIATE_RESPONSE_INSTRUCTIONS,
  
  // Balanceado para uso general  
  BALANCED: `Eres JARVIS, asistente IA eficiente. Al conectar di "Sí?" y espera instrucciones. Responde conciso pero completo. Máximo 3 oraciones.`,
  
  // Completo para sesiones largas o tareas complejas
  DETAILED: DETAILED_INSTRUCTIONS
} as const;

// Configuración de voz optimizada para respuesta inmediata
export const VOICE_CONFIG = {
  voice: 'alloy', // Voz clara y eficiente
  turn_detection: {
    type: 'server_vad' as const,
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 400 // REDUCIDO para respuesta más rápida
  }
};

// Auto-sleep optimizado
export const AUTO_SLEEP_CONFIG = {
  timeoutMs: 15_000, // 15 segundos (reducido de 20)
  warningMs: 12_000, // Aviso a los 12 segundos
};

// Configuración de sesión optimizada para respuesta inmediata
export const SESSION_CONFIG = {
  model: 'gpt-4o-mini-realtime-preview',
  modalities: ['text', 'audio'],
  instructions: INSTRUCTION_MODES.IMMEDIATE, // CAMBIO: Usar modo inmediato
  voice: VOICE_CONFIG.voice,
  turn_detection: VOICE_CONFIG.turn_detection,
  // Configuraciones para reducir latencia
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  input_audio_transcription: {
    model: 'whisper-1'
  },
  // NUEVO: Configuraciones específicas para respuesta inmediata
  temperature: 0.3, // Menor aleatoriedad para respuestas más consistentes
  max_response_output_tokens: 50 // Limitar tokens para respuesta "Sí?"
};

// Wake word simplificado
export const WAKE_WORD_CONFIG = {
  words: ['jarvis', 'hey jarvis'],
  language: 'es-ES',
  continuous: true,
  interimResults: false // Solo resultados finales para mayor precisión
};

// NUEVO: Configuración específica para respuesta inmediata
export const IMMEDIATE_RESPONSE_CONFIG = {
  type: 'response.create',
  response: {
    modalities: ['audio', 'text'],
    instructions: 'Di únicamente "Sí?" con tono de pregunta. No digas nada más.',
    voice: 'alloy',
    output_audio_format: 'pcm16',
    temperature: 0.1, // Muy baja para consistencia
    max_output_tokens: 10 // Máximo 10 tokens para "Sí?"
  }
} as const;