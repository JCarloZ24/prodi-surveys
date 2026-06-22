"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, authInputClass, authButtonClass } from "@/components/portal/AuthShell";

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }
      router.push("/portal/pending");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resend: true }),
      });
      if (res.ok) setNotice("A new code has been sent to your email.");
      else setError("Could not resend the code. Try again shortly.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-7">
        <h2 className="text-[26px] font-extrabold tracking-[-0.6px] text-[#18181B]">Verify your email</h2>
        <p className="mt-1.5 text-[13.5px] text-gray-500">
          We sent a 6-digit code to <strong className="text-[#18181B]">{email}</strong>. Enter it below.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            autoComplete="one-time-code"
            className={authInputClass + " tracking-[6px]"}
          />
        </div>

        {error && (
          <div className="rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-semibold text-red-600">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-[9px] border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-700">
            {notice}
          </div>
        )}

        <button type="submit" disabled={loading || code.length !== 6} className={authButtonClass}>
          {loading ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-gray-500">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-bold text-[#18181B] hover:underline disabled:opacity-40"
        >
          {resending ? "Sending…" : "Resend"}
        </button>
      </p>
    </AuthShell>
  );
}
