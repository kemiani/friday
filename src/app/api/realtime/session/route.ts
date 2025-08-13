import { NextResponse } from 'next/server';

export const runtime = 'edge'; // menor latencia para crear el token

export async function GET() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Falta OPENAI_API_KEY en el servidor' },
      { status: 500 }
    );
  }

  // Creamos sesión efímera en OpenAI Realtime API
  const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview-2025-06-03',
      // opcional: setear voz, instrucciones iniciales, formatos de audio, etc.
      // voice: 'alloy',
      // instructions: 'Eres un asistente de voz...',
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    return NextResponse.json(
      { error: 'No se pudo crear la sesión efímera', details: text },
      { status: 500 }
    );
  }

  const data = await r.json();
  const apiKey = data?.client_secret?.value; // <- token efímero

  return NextResponse.json({ apiKey }, { headers: { 'Cache-Control': 'no-store' } });
}
