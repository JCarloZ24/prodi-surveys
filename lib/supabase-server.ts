import { createClient } from "@supabase/supabase-js";
import { requireAnyEnv } from "@/lib/env";

export function createAdminClient() {
  return createClient(
    requireAnyEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]),
    requireAnyEnv(["SUPABASE_SERVICE_ROLE_KEY"]),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
