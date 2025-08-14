import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/server/supabaseAdmin';
import bcrypt from 'bcryptjs';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { user_id, voice_key } = await request.json();
    if (!user_id || !voice_key) {
      return NextResponse.json({ error: 'user_id y voice_key requeridos' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('voice_key_hash')
      .eq('id', user_id)
      .maybeSingle();
    if (error || !user?.voice_key_hash) {
      return NextResponse.json({ error: 'Usuario no encontrado o sin clave de voz' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(voice_key.toLowerCase(), user.voice_key_hash);
    return NextResponse.json({ valid: isValid });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
