import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/server/supabaseAdmin';
import bcrypt from 'bcryptjs';
export const runtime = 'nodejs';

export async function PATCH(request: NextRequest) {
  try {
    const { user_id, name, email, voice_key, ...otherUpdates } = await request.json();
    if (!user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 });

    const updates: Record<string, unknown> = { ...otherUpdates, updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (voice_key) {
      const saltRounds = 12;
      updates.voice_key_hash = await bcrypt.hash(voice_key.toLowerCase(), saltRounds);
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user_id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Error actualizando usuario' }, { status: 500 });

    const { voice_key_hash: _hash, ...userWithoutHash } = updatedUser;
    return NextResponse.json(userWithoutHash);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
