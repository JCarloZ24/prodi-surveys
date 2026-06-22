"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { AuthShell, authInputClass, authButtonClass } from "@/components/portal/AuthShell";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createBrowserSupabase();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      if (signInError) {
        setError("Incorrect email or password.");
        return;
      }
      // The server gate (proxy + portal page) routes the user to the dashboard,
      // the email-verification page, or the pending-approval page.
      router.push("/portal");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-7">
        <h2 className="text-[26px] font-extrabold tracking-[-0.6px] text-[#18181B]">Sign in</h2>
        <p className="mt-1.5 text-[13.5px] text-gray-500">
          Enter your email and password to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={authInputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className={authInputClass}
          />
        </div>

        {error && (
          <div className="rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-semibold text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className={authButtonClass}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/portal/signup" className="font-bold text-[#18181B] hover:underline">
          Create one
        </Link>
      </p>

      <p className="mt-8 text-center text-[12px] text-gray-400">
        admin.prodigitalitydata.live · Internal staff portal
      </p>
    </AuthShell>
  );
}
