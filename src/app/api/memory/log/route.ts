// src/app/api/memory/log/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/server/supabaseAdmin";

export const runtime = "nodejs";

type Body = {
  user_id: string;
  session_id: string;
  message_type: "user" | "assistant" | "system" | "function_call" | "error";
  content: string;
  tokens_used?: number;
  processing_time_ms?: number;
  context?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const { user_id, session_id, message_type, content, tokens_used = 0, processing_time_ms = 0, context = {} } =
      (await req.json()) as Body;

    if (!user_id || !session_id || !message_type || !content) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("conversation_history")
      .insert([{ user_id, session_id, message_type, content, tokens_used, processing_time_ms, context }])
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error("memory/log error", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
