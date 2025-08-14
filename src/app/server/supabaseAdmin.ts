import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Anti-footgun: valida que sea service_role
function getJwtRole(jwt: string) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
    return payload?.role;
  } catch { return undefined; }
}

if (!url || !serviceKey) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}
const role = getJwtRole(serviceKey);
if (role !== "service_role") {
  throw new Error(`SUPABASE_SERVICE_ROLE_KEY no es 'service_role' (recibí '${role ?? "desconocido"}')`);
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
