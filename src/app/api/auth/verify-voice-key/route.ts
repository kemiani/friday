// src/app/api/auth/verify-voice-key/route.ts
// API para verificar clave de voz

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { user_id, voice_key } = await request.json();

    if (!user_id || !voice_key) {
      return NextResponse.json(
        { error: 'user_id y voice_key requeridos' },
        { status: 400 }
      );
    }

    // Obtener hash de la base de datos
    const { data: user, error } = await supabase
      .from('users')
      .select('voice_key_hash')
      .eq('id', user_id)
      .single();

    if (error || !user || !user.voice_key_hash) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o sin clave de voz' },
        { status: 404 }
      );
    }

    // Verificar clave de voz
    const isValid = await bcrypt.compare(voice_key.toLowerCase(), user.voice_key_hash);

    return NextResponse.json({ valid: isValid });

  } catch (error) {
    console.error('Error en /api/auth/verify-voice-key:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}