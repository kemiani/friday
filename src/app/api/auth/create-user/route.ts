// src/app/api/auth/create-user/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/server/supabaseAdmin";

export const runtime = "nodejs";

const AUTH = ["wallet","google","email","telegram","discord","x","phone"] as const;
type AuthMethod = typeof AUTH[number];

type Body = {
  wallet_address?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  timezone?: string;
  language_preference?: string;
  auth_method: AuthMethod; // NOT NULL + CHECK en DB
};

export async function POST(req: Request) {
  try {
    const headers = req.headers;
    const ip =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      null;
    const ua = headers.get("user-agent") ?? null;

    const body = (await req.json()) as Body;
    const {
      wallet_address,
      email,
      name,
      avatar_url,
      timezone = "UTC",
      language_preference = "es",
      auth_method
    } = body;

    if (!AUTH.includes(auth_method)) {
      return NextResponse.json({ error: "auth_method inválido" }, { status: 400 });
    }
    if (!wallet_address && !email) {
      return NextResponse.json({ error: "wallet_address o email requerido" }, { status: 400 });
    }

    // Idempotente: si existe, devolver
    let finder = supabaseAdmin.from("users").select("*").limit(1);
    if (wallet_address) finder = finder.eq("wallet_address", wallet_address);
    if (!wallet_address && email) finder = finder.eq("email", email);

    const { data: existing, error: findErr } = await finder.maybeSingle();
    if (findErr) throw findErr;

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    // Crear usuario con campos de onboarding
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("users")
      .insert([
        {
          wallet_address: wallet_address?.toLowerCase() ?? null,
          email: email ?? null,
          name: name ?? null,
          auth_method,
          avatar_url: avatar_url ?? null,
          timezone,
          language_preference,
          tier: "free",

          // Nuevos campos de onboarding
          onboarding_completed: false,
          onboarding_step: 0,
          pinecone_namespace: `user_${crypto.randomUUID()}`
        }
      ])
      .select("*")
      .single();
    if (insErr) throw insErr;

    // Crear límites iniciales
    await supabaseAdmin.from("user_limits").insert([{ user_id: inserted.id }]);

    // Audit log
    await supabaseAdmin.from("audit_logs").insert([
      {
        user_id: inserted.id,
        action_type: "user_created",
        resource_type: "user",
        resource_id: inserted.id,
        new_values: inserted,
        ip_address: ip,
        user_agent: ua
      }
    ]);

    return NextResponse.json({
      ...inserted,
      is_new_user: true,
      needs_onboarding: true
    }, { status: 200 });
  } catch (e: any) {
    console.error("create-user error", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
