import { createClient } from "@supabase/supabase-js";
import { requireAnyEnv } from "@/lib/env";

export function createAnonClient() {
  return createClient(
    requireAnyEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]),
    requireAnyEnv(["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]),
  );
}
