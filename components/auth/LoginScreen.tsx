"use client";

import { usePortal, USER_NAMES } from "@/lib/store";
import { counts, totals } from "@/lib/selectors";
import { initials } from "@/lib/format";
import { LogoMark } from "@/lib/icons";
import { Avatar } from "@/components/ui/Avatar";
import type { Role } from "@/lib/types";

const ROLES: { role: Role; label: string; sub: string; bg: string }[] = [
  { role: "admin", label: "Super Admin", sub: "Augusto Teleg", bg: "#18181B" },
  { role: "enumerator", label: "Enumerator", sub: "Maria Santos", bg: "#E0195F" },
  { role: "stakeholder", label: "Stakeholder", sub: "Arianne · read-only", bg: "#7C3AED" },
];

export function LoginScreen() {
  const { state, actions } = usePortal();
  const c = counts(state.respondents);
  const { totalTarget, overallPct } = totals(state.targets, c.verified);

  return (
    <div className="absolute inset-0 z-40 flex bg-white">
      {/* Brand panel */}
      <div
        className="relative flex w-[46%] flex-none flex-col overflow-hidden px-14 py-[52px] text-white"
        style={{ background: "linear-gradient(150deg,#1F1147 0%,#3A1655 55%,#7A1742 100%)" }}
      >
        <div
          className="absolute -right-[120px] -top-[120px] h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(240,36,106,.32),transparent 70%)" }}
        />
        <div
          className="absolute -bottom-[90px] -left-20 h-80 w-80 rounded-full"
          style={{ background: "radial-gradient(circle,rgba(251,146,60,.22),transparent 70%)" }}
        />
        <div className="relative flex items-center gap-3">
          <LogoMark size={34} gradientId="pgLogin" />
          <div className="text-[18px] font-extrabold tracking-[-.3px]">Prodi-Surveys</div>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <h1 className="mb-4 max-w-[380px] text-[32px] font-extrabold leading-[1.15] tracking-[-.8px]">
            Survey verification &amp; fieldwork operations
          </h1>
          <p className="max-w-[380px] text-[14.5px] leading-[1.65] text-white/70">
            Register, verify, and track every respondent — with selfie checks, QA review, referral
            tracking, and a full audit trail.
          </p>
          <div className="mt-8 flex gap-6">
            <div>
              <div className="text-2xl font-extrabold tracking-[-.5px]">
                {c.verified}/{totalTarget}
              </div>
              <div className="mt-0.5 text-[11.5px] font-semibold text-white/60">Verified to date</div>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <div className="text-2xl font-extrabold tracking-[-.5px]">{overallPct}%</div>
              <div className="mt-0.5 text-[11.5px] font-semibold text-white/60">Of target reached</div>
            </div>
          </div>
        </div>
        <div className="flex-1" />
        <div className="relative text-xs text-white/50">
          surveys.prodigitality.net · internal staff portal
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="w-full max-w-[380px]">
          <h2 className="mb-1.5 text-2xl font-extrabold tracking-[-.5px]">Sign in</h2>
          <p className="mb-[26px] text-[13.5px] text-gray-500">
            Welcome back. Sign in to the operations portal.
          </p>
          <label className="mb-3.5 block">
            <span className="mb-1.5 block text-xs font-bold text-gray-700">Work email</span>
            <input
              value={state.loginEmail}
              onChange={(e) => actions.setLoginEmail(e.target.value)}
              placeholder="you@prodigitality.net"
              className="h-11 w-full rounded-[10px] border border-[#E2E2E6] px-3.5 text-sm outline-none focus:border-brand-pink"
            />
          </label>
          <label className="mb-2 block">
            <span className="mb-1.5 block text-xs font-bold text-gray-700">Password</span>
            <input
              value={state.loginPw}
              onChange={(e) => actions.setLoginPw(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="h-11 w-full rounded-[10px] border border-[#E2E2E6] px-3.5 text-sm outline-none focus:border-brand-pink"
            />
          </label>
          <div className="mb-5 text-right">
            <span className="cursor-pointer text-[12.5px] font-semibold text-brand-pink">
              Forgot password?
            </span>
          </div>
          <button
            onClick={() => actions.login("admin")}
            className="h-[46px] w-full rounded-[11px] bg-brand-ink text-[14.5px] font-bold text-white"
          >
            Sign in
          </button>
          <div className="my-[18px] mt-[26px] flex items-center gap-3">
            <div className="h-px flex-1 bg-[#EFEFF1]" />
            <span className="text-[11.5px] font-semibold text-gray-400">QUICK DEMO ACCESS</span>
            <div className="h-px flex-1 bg-[#EFEFF1]" />
          </div>
          <div className="flex flex-col gap-2">
            {ROLES.map((r) => (
              <button
                key={r.role}
                onClick={() => actions.login(r.role)}
                className="flex w-full items-center gap-3 rounded-[11px] border border-[#E7E7EA] bg-white p-2.5 px-3 text-left hover:border-brand-pink hover:bg-brand-pinkSoft2"
              >
                <Avatar initials={initials(r.sub).toUpperCase()} bg={r.bg} size={32} radius={9} />
                <span className="flex-1">
                  <span className="block text-[13px] font-bold text-brand-ink">{r.label}</span>
                  <span className="block text-[11.5px] text-gray-400">{r.sub}</span>
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4C4CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-gray-400">
            Signed in as {USER_NAMES[state.role]} · demo data
          </p>
        </div>
      </div>
    </div>
  );
}
