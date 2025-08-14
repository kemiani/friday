// src/app/api/sessions/start/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/server/supabaseAdmin";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user_id, platform = "web" } = await req.json();
    if (!user_id) return NextResponse.json({ error: "user_id requerido" }, { status: 400 });

    const session_token = crypto.randomUUID();
    const { data, error } = await supabaseAdmin
      .from("jarvis_sessions")
      .insert([{ user_id, session_token, platform }])
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error("sessions/start error", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
