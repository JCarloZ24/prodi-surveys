import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-ssr";
import { createAdminClient } from "@/lib/supabase-server";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Role = Database["public"]["Enums"]["user_role"];

// Resolve the signed-in user's profile, or null if there is no valid session.
// The profile row is read with the service-role client so we never depend on
// RLS timing for the caller's own row.
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = createAdminClient();
  const { data } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data ?? null;
}

// Server-component guard: returns the profile only when the account is fully
// usable. Otherwise redirects to the appropriate gate page.
export async function requireApproved(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/portal/login");
  if (!profile.is_email_verified) redirect("/portal/verify-email");
  if (profile.status !== "approved") redirect("/portal/pending");
  return profile;
}
