// src/app/api/auth/update-profile/route.ts
// API para actualizar perfil de usuario

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase/supabase';
import bcrypt from 'bcryptjs';

export async function PATCH(request: NextRequest) {
  try {
    const { user_id, name, email, voice_key, ...otherUpdates } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id requerido' },
        { status: 400 }
      );
    }

    const updates: any = {
      ...otherUpdates,
      updated_at: new Date().toISOString()
    };

    // Agregar campos opcionales
    if (name) updates.name = name;
    if (email) updates.email = email;

    // Encriptar clave de voz si se proporciona
    if (voice_key) {
      const saltRounds = 12;
      updates.voice_key_hash = await bcrypt.hash(voice_key.toLowerCase(), saltRounds);
    }

    // Actualizar usuario
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando usuario:', error);
      return NextResponse.json(
        { error: 'Error actualizando usuario' },
        { status: 500 }
      );
    }

    // No devolver el hash de la clave de voz
    const { voice_key_hash, ...userWithoutHash } = updatedUser;

    return NextResponse.json(userWithoutHash);

  } catch (error) {
    console.error('Error en /api/auth/update-profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}