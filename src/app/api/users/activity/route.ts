// src/app/api/users/activity/route.ts
// API para registrar actividad y sesiones de usuario - IMPORTS CORREGIDOS

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const { 
      user_id, 
      action_type, 
      resource_type, 
      resource_id, 
      metadata,
      session_data
    } = await request.json();

    if (!user_id || !action_type || !resource_type) {
      return NextResponse.json(
        { error: 'user_id, action_type y resource_type requeridos' },
        { status: 400 }
      );
    }

    // Obtener IP y User Agent de los headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const userAgent = request.headers.get('user-agent');
    const ipAddress = forwardedFor?.split(',')[0] || 'unknown';

    // 1. Registrar en audit_logs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_id,
        action_type,
        resource_type,
        resource_id,
        new_values: metadata || {},
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          source: 'jarvis_agent'
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (auditError) {
      console.error('Error registrando audit log:', auditError);
    }

    // 2. Si es una sesión, registrar en jarvis_sessions
    if (action_type === 'session_connected' && session_data) {
      const { error: sessionError } = await supabase
        .from('jarvis_sessions')
        .insert({
          user_id,
          session_token: session_data.session_id || `jarvis_${Date.now()}`,
          status: 'active',
          platform: session_data.platform || 'web',
          user_agent: userAgent,
          ip_address: ipAddress,
          metadata: {
            ...session_data,
            user_tier: metadata?.user_tier,
            auth_method: metadata?.auth_method
          }
        });

      if (sessionError) {
        console.error('Error registrando sesión:', sessionError);
      }
    }

    // 3. Actualizar last_active del usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error actualizando last_active:', updateError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Actividad registrada correctamente'
    });

  } catch (error) {
    console.error('Error en /api/users/activity:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET: Obtener actividad reciente del usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id requerido' },
        { status: 400 }
      );
    }

    // Obtener logs de actividad reciente
    const { data: activities, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error obteniendo actividades:', error);
      return NextResponse.json(
        { error: 'Error obteniendo actividades' },
        { status: 500 }
      );
    }

    return NextResponse.json(activities || []);

  } catch (error) {
    console.error('Error en GET /api/users/activity:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}