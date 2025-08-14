import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/server/supabaseAdmin';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { user_id, action_type, resource_type, resource_id, metadata, session_data } = await request.json();
    if (!user_id || !action_type || !resource_type) {
      return NextResponse.json({ error: 'user_id, action_type y resource_type requeridos' }, { status: 400 });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const userAgent = request.headers.get('user-agent');
    const ipAddress = forwardedFor?.split(',')[0] || 'unknown';

    // 1) audit_logs
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      user_id,
      action_type,
      resource_type,
      resource_id,
      new_values: metadata || {},
      metadata: { ...metadata, timestamp: new Date().toISOString(), source: 'jarvis_agent' },
      ip_address: ipAddress,
      user_agent: userAgent
    });
    if (auditError) console.error('audit log error', auditError);

    // 2) jarvis_sessions (opcional)
    if (action_type === 'session_connected' && session_data) {
      const { error: sessionError } = await supabaseAdmin.from('jarvis_sessions').insert({
        user_id,
        session_token: session_data.session_id || `jarvis_${Date.now()}`,
        status: 'active',
        platform: session_data.platform || 'web',
        user_agent: userAgent,
        ip_address: ipAddress,
        metadata: { ...session_data, user_tier: metadata?.user_tier, auth_method: metadata?.auth_method }
      });
      if (sessionError) console.error('session error', sessionError);
    }

    // 3) last_active
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ last_active: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', user_id);
    if (updateError) console.error('update last_active error', updateError);

    return NextResponse.json({ success: true, message: 'Actividad registrada correctamente' });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    if (!userId) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 });

    const { data: activities, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: 'Error obteniendo actividades' }, { status: 500 });
    return NextResponse.json(activities || []);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
