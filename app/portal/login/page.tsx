"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/lib/icons";
import type { Role } from "@/lib/types";

const ACCOUNTS: { role: Role; label: string; description: string; initial: string; color: string }[] = [
  { role: "admin",        label: "Super Admin",  description: "Full access — QA, payouts, settings", initial: "A", color: "#7C3AED" },
  { role: "enumerator",   label: "Enumerator",   description: "Field data collection & respondents",  initial: "E", color: "#E0195F" },
  { role: "stakeholder",  label: "Stakeholder",  description: "Read-only dashboard & reports",        initial: "S", color: "#0369A1" },
];

export default function PortalLoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/portal/auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role: selected, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Sign-in failed"); return; }
      router.push("/portal");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:flex-col lg:w-[46%] xl:w-[44%] relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, #16083A 0%, #2E1357 55%, #1B0B44 100%)" }}
      >
        {/* Glow blobs */}
        <div
          className="pointer-events-none absolute top-[30%] right-[-80px] h-[480px] w-[480px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #8B2FC9 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-[10%] left-[-60px] h-[300px] w-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #E0195F 0%, transparent 70%)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col p-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-[15px] font-extrabold tracking-[-0.3px] text-white/90">
              Prodi-Surveys
            </span>
          </div>

          {/* Headline */}
          <div className="my-auto pt-8">
            <h1 className="text-[38px] font-extrabold leading-[1.1] tracking-[-1px] text-white">
              Survey verification &<br />fieldwork operations
            </h1>
            <p className="mt-4 max-w-[320px] text-[14.5px] leading-[1.65] text-white/50">
              Register, verify, and track every respondent — with selfie checks, QA review,
              referral tracking, and a full audit trail.
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 pb-2">
            <div>
              <div className="text-[26px] font-extrabold text-white">51/114</div>
              <div className="mt-0.5 text-[12px] text-white/40">Verified to date</div>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div>
              <div className="text-[26px] font-extrabold text-white">45%</div>
              <div className="mt-0.5 text-[12px] text-white/40">Of target reached</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-white px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <LogoMark size={24} />
            <span className="text-[14px] font-extrabold text-[#18181B]">Prodi-Surveys</span>
          </div>

          <div className="mb-7">
            <h2 className="text-[26px] font-extrabold tracking-[-0.6px] text-[#18181B]">Sign in</h2>
            <p className="mt-1.5 text-[13.5px] text-gray-500">
              Select your account and enter your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account selector */}
            <div>
              <div className="mb-2 text-[12.5px] font-semibold text-gray-600">Account</div>
              <div className="space-y-2">
                {ACCOUNTS.map((acct) => {
                  const isSelected = selected === acct.role;
                  return (
                    <button
                      key={acct.role}
                      type="button"
                      onClick={() => { setSelected(acct.role); setError(""); }}
                      className="flex w-full items-center gap-3 rounded-[10px] border px-3.5 py-3 text-left transition-all"
                      style={{
                        borderColor: isSelected ? acct.color : "#E4E4E7",
                        background:  isSelected ? acct.color + "08" : "#FAFAFA",
                        boxShadow:   isSelected ? `0 0 0 2px ${acct.color}30` : "none",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                        style={{ background: acct.color }}
                      >
                        {acct.initial}
                      </div>
                      {/* Labels */}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-bold text-[#18181B]">{acct.label}</div>
                        <div className="mt-0.5 text-[12px] text-gray-400">{acct.description}</div>
                      </div>
                      {/* Radio dot */}
                      <div
                        className="ml-auto flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                        style={{
                          borderColor:     isSelected ? acct.color : "#D1D5DB",
                          backgroundColor: isSelected ? acct.color : "transparent",
                        }}
                      >
                        {isSelected && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11 w-full rounded-[10px] border border-[#E4E4E7] bg-[#FAFAFA] px-3.5 text-[13.5px] text-[#18181B] placeholder:text-gray-400 transition-colors focus:border-[#18181B] focus:bg-white focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-semibold text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selected || !password}
              className="h-11 w-full rounded-[10px] bg-[#18181B] text-[13.5px] font-bold text-white transition-opacity disabled:opacity-40"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-[12px] text-gray-400">
            admin.prodigitalitydata.live · Internal staff portal
          </p>
        </div>
      </div>
    </div>
  );
}
