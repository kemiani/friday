// src/app/api/users/contacts/route.ts
// API para manejar contactos del usuario

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id requerido' },
        { status: 400 }
      );
    }

    const { data: contacts, error } = await supabase
      .from('user_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error obteniendo contactos:', error);
      return NextResponse.json(
        { error: 'Error obteniendo contactos' },
        { status: 500 }
      );
    }

    return NextResponse.json(contacts || []);

  } catch (error) {
    console.error('Error en /api/users/contacts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, name, phone, email, relationship, notes } = await request.json();

    if (!user_id || !name) {
      return NextResponse.json(
        { error: 'user_id y name requeridos' },
        { status: 400 }
      );
    }

    const { data: newContact, error } = await supabase
      .from('user_contacts')
      .insert({
        user_id,
        name,
        phone,
        email,
        relationship: relationship || 'other',
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando contacto:', error);
      return NextResponse.json(
        { error: 'Error creando contacto' },
        { status: 500 }
      );
    }

    return NextResponse.json(newContact);

  } catch (error) {
    console.error('Error en POST /api/users/contacts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}