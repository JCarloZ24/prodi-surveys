"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/lib/icons";
import type { Role } from "@/lib/types";

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "admin", label: "Admin", desc: "Augusto Teleg · Full access" },
  { value: "enumerator", label: "Enumerator", desc: "Maria Santos · Field team" },
  { value: "stakeholder", label: "Stakeholder", desc: "Arianne · Read-only" },
];

export default function PortalLoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed");
        return;
      }
      router.push("/portal");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex">
            <LogoMark size={40} />
          </div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-brand-ink">
            Prodi-Surveys Portal
          </h1>
          <p className="mt-1.5 text-[13.5px] text-gray-500">Staff sign-in</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-line bg-white p-7 shadow-sm"
        >
          {/* Role selector */}
          <div className="mb-5">
            <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.5px] text-gray-500">
              Your role
            </label>
            <div className="flex flex-col gap-2">
              {ROLES.map((r) => {
                const active = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={[
                      "flex items-center gap-3 rounded-[11px] border-[1.5px] px-4 py-[11px] text-left transition-colors",
                      active
                        ? "border-brand-pink bg-brand-pinkSoft"
                        : "border-line bg-white hover:border-brand-pinkLine hover:bg-brand-pinkSoft2",
                    ].join(" ")}
                  >
                    <div
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                      style={{ background: active ? "#E0195F" : "#CBD5E1" }}
                    >
                      {r.label[0]}
                    </div>
                    <div>
                      <div
                        className={[
                          "text-[13.5px] font-bold",
                          active ? "text-[#9D174D]" : "text-brand-ink",
                        ].join(" ")}
                      >
                        {r.label}
                      </div>
                      <div className="text-[11.5px] text-gray-400">{r.desc}</div>
                    </div>
                    {active && (
                      <svg
                        className="ml-auto"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#E0195F"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label
              htmlFor="pw"
              className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.5px] text-gray-500"
            >
              Password
            </label>
            <input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="h-11 w-full rounded-[10px] border border-line bg-muted px-3.5 text-[14px] text-brand-ink placeholder:text-gray-400 focus:border-brand-pink focus:outline-none"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-semibold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="h-11 w-full rounded-[11px] text-[14px] font-bold text-white transition-opacity disabled:opacity-50"
            style={{ background: "#18181B" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-gray-400">
          Respondents — access the survey at the main URL, not here.
        </p>
      </div>
    </div>
  );
}
