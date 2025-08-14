// src/app/api/realtime/session/route.ts - Versión optimizada con imports corregidos

import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Configuración básica para la sesión
const SESSION_CONFIG = {
  model: 'gpt-4o-mini-realtime-preview',
  voice: 'alloy',
  modalities: ['text', 'audio'],
  instructions: `Eres JARVIS, asistente IA profesional.

COMPORTAMIENTO AL CONECTAR:
- Inmediatamente di "Sí?" con tono de pregunta
- NO agregues explicaciones ni saludos largos
- Solo "Sí?" y espera mi instrucción

DURANTE LA CONVERSACIÓN:
- Respuestas concisas (máximo 2-3 oraciones)
- Tono profesional pero amigable
- Si procesas: "Un momento..."`,
  turn_detection: {
    type: 'server_vad' as const,
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 400
  },
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  input_audio_transcription: {
    model: 'whisper-1'
  }
};

export async function GET() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY no configurada' },
      { status: 500 }
    );
  }

  try {
    // Crear sesión efímera con configuración optimizada
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SESSION_CONFIG.model,
        voice: SESSION_CONFIG.voice,
        // Configuraciones para reducir latencia y tokens
        modalities: SESSION_CONFIG.modalities,
        instructions: SESSION_CONFIG.instructions, // Usar prompt optimizado
        turn_detection: SESSION_CONFIG.turn_detection,
        input_audio_format: SESSION_CONFIG.input_audio_format,
        output_audio_format: SESSION_CONFIG.output_audio_format,
        input_audio_transcription: SESSION_CONFIG.input_audio_transcription,
        // Configuraciones adicionales para eficiencia
        max_response_output_tokens: 150, // Limitar tokens de respuesta
        temperature: 0.7, // Balancear creatividad vs consistencia
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error OpenAI:', errorText);
      return NextResponse.json(
        { error: 'Error creando sesión', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const apiKey = data?.client_secret?.value;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Token efímero no recibido' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        apiKey,
        sessionId: data.id, // Útil para debugging
        expiresAt: data.expires_at
      }, 
      { 
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        } 
      }
    );

  } catch (error) {
    console.error('Error en /api/realtime/session:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}