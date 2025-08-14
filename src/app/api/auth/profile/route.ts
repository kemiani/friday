// src/app/api/auth/profile/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/server/supabaseAdmin";

export const runtime = "nodejs";

type Body = {
  wallet_address?: string;
  email?: string;
};

export async function POST(req: Request) {
  try {
    const { wallet_address, email } = (await req.json()) as Body;
    if (!wallet_address && !email) {
      return NextResponse.json({ error: "wallet_address o email requerido" }, { status: 400 });
    }

    let q = supabaseAdmin.from("users").select("*").limit(1);
    if (wallet_address) q = q.eq("wallet_address", wallet_address);
    if (!wallet_address && email) q = q.eq("email", email);

    const { data, error } = await q.maybeSingle();
    if (error) throw error;

    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error("profile error", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
