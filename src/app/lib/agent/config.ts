// src/app/lib/agent/config.ts - Versión optimizada

// Prompt ultra-optimizado para ahorrar tokens
export const OPTIMIZED_INSTRUCTIONS = `Eres JARVIS. Responde conciso, profesional y eficiente. Al conectar di solo "Listo" o "Aquí estoy". Usa máximo 2-3 oraciones por respuesta.`.trim();

// Prompt completo para casos que requieren más contexto (opcional)
export const DETAILED_INSTRUCTIONS = `
Eres JARVIS, asistente IA de Tony Stark.

PERSONALIDAD: Inteligente, eficiente, profesional pero amigable.

COMPORTAMIENTO:
- Respuestas concisas (máximo 2-3 oraciones)
- Al conectar: saluda brevemente ("Listo" o "Aquí estoy")
- Si procesas: "Un momento..."
- Tono profesional pero cálido

CONTEXTO: Asistente de voz tiempo real, confidente inteligente.
`.trim();

// Configuraciones por contexto
export const INSTRUCTION_MODES = {
  // Ultra corto para activación inicial y respuestas simples
  MINIMAL: `Eres JARVIS. Sé conciso y profesional. Al conectar saluda con "Listo".`,
  
  // Balanceado para uso general  
  BALANCED: `Eres JARVIS, asistente IA eficiente. Responde conciso pero completo. Al conectar di "Listo, ¿en qué puedo ayudarte?". Máximo 3 oraciones.`,
  
  // Completo para sesiones largas o tareas complejas
  DETAILED: DETAILED_INSTRUCTIONS
} as const;

// Configuración de voz optimizada
export const VOICE_CONFIG = {
  voice: 'alloy', // Voz clara y eficiente
  turn_detection: {
    type: 'server_vad' as const,
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500 // Reduce latencia de detección
  }
};

// Auto-sleep optimizado
export const AUTO_SLEEP_CONFIG = {
  timeoutMs: 15_000, // 15 segundos (reducido de 20)
  warningMs: 12_000, // Aviso a los 12 segundos
};

// Configuración de sesión optimizada
export const SESSION_CONFIG = {
  model: 'gpt-4o-mini-realtime-preview',
  modalities: ['text', 'audio'],
  instructions: INSTRUCTION_MODES.MINIMAL, // Usar modo mínimo por defecto
  voice: VOICE_CONFIG.voice,
  turn_detection: VOICE_CONFIG.turn_detection,
  // Configuraciones para reducir latencia
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  input_audio_transcription: {
    model: 'whisper-1'
  }
};

// Wake word simplificado
export const WAKE_WORD_CONFIG = {
  words: ['jarvis', 'hey jarvis'],
  language: 'es-ES',
  continuous: true,
  interimResults: false // Solo resultados finales para mayor precisión
};