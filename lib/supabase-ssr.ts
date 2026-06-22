import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { requireAnyEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

function publicEnv() {
  return {
    url: requireAnyEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]),
    anon: requireAnyEnv(["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]),
  };
}

// Supabase client for server components and route handlers — reads/writes the
// auth session through Next's cookie store.
export async function createServerSupabase() {
  const cookieStore = await cookies();
  const { url, anon } = publicEnv();

  return createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies are read-only — safe to
          // ignore; the middleware (proxy) refreshes the session cookie instead.
        }
      },
    },
  });
}

// Middleware/proxy helper: refreshes the auth session and returns the resolved
// user plus a response carrying any updated session cookies.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anon } = publicEnv();

  const supabase = createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
