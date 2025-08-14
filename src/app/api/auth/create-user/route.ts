// src/app/api/auth/create-user/route.ts
// API para crear nuevo usuario

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const { wallet_address, auth_method, email, name, avatar_url } = await request.json();

    if (!wallet_address || !auth_method) {
      return NextResponse.json(
        { error: 'Wallet address y auth_method requeridos' },
        { status: 400 }
      );
    }

    // Verificar que no exista el usuario
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', wallet_address.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuario ya existe' },
        { status: 409 }
      );
    }

    // Crear nuevo usuario
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        wallet_address: wallet_address.toLowerCase(),
        auth_method,
        email,
        name,
        avatar_url,
        tier: 'free'
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creando usuario:', userError);
      return NextResponse.json(
        { error: 'Error creando usuario' },
        { status: 500 }
      );
    }

    // Crear límites iniciales para el usuario
    const { error: limitsError } = await supabase
      .from('user_limits')
      .insert({
        user_id: newUser.id,
        daily_minutes_used: 0,
        monthly_calls_used: 0,
        daily_limit: 60, // 1 hora gratis
        monthly_limit: 100 // 100 llamadas gratis
      });

    if (limitsError) {
      console.error('Error creando límites:', limitsError);
    }

    return NextResponse.json({
      ...newUser,
      is_new_user: true,
      limits: {
        daily_minutes_used: 0,
        monthly_calls_used: 0,
        daily_limit: 60,
        monthly_limit: 100
      }
    });

  } catch (error) {
    console.error('Error en /api/auth/create-user:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
