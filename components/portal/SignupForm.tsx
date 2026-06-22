"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { AuthShell, authInputClass, authButtonClass } from "@/components/portal/AuthShell";

type Props = {
  role: "enumerator" | "stakeholder";
  title: string;
  subtitle: string;
  // Optional role-specific field (region for enumerators, organization for stakeholders).
  extraField?: { key: "region" | "organization"; label: string; placeholder: string };
};

export function SignupForm({ role, title, subtitle, extraField }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [extra, setExtra] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          full_name: fullName,
          email,
          password,
          ...(extraField ? { [extraField.key]: extra } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign-up failed");
        return;
      }

      // Sign the new user in so the verification + pending gates can read their
      // session. email_confirm was set at creation, so password login works.
      const supabase = createBrowserSupabase();
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      router.push("/portal/verify-email");
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
        <h2 className="text-[26px] font-extrabold tracking-[-0.6px] text-[#18181B]">{title}</h2>
        <p className="mt-1.5 text-[13.5px] text-gray-500">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Juan dela Cruz"
            autoComplete="name"
            className={authInputClass}
          />
        </div>

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

        {extraField && (
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">
              {extraField.label}
            </label>
            <input
              type="text"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder={extraField.placeholder}
              className={authInputClass}
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
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
          disabled={loading || !fullName || !email || password.length < 8}
          className={authButtonClass}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-gray-500">
        Already have an account?{" "}
        <Link href="/portal/login" className="font-bold text-[#18181B] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
