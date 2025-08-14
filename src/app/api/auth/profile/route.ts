// src/app/api/auth/profile/route.ts
// API para obtener perfil de usuario

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const { wallet_address, auth_method } = await request.json();

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address requerida' },
        { status: 400 }
      );
    }

    // Buscar usuario por wallet address
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', wallet_address.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener límites de uso
    const { data: limits } = await supabase
      .from('user_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      ...user,
      limits: limits || null,
      is_new_user: false
    });

  } catch (error) {
    console.error('Error en /api/auth/profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
