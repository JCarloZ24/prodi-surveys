"use client";

import { usePortal, USER_NAMES } from "@/lib/store";
import { initials } from "@/lib/format";
import { LogoMark } from "@/lib/icons";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/lib/cx";
import type { Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Super Admin",
  enumerator: "Enumerator",
  stakeholder: "Stakeholder (read-only)",
};
const ROLE_AVATAR_BG: Record<Role, string> = {
  admin: "#18181B",
  enumerator: "#E0195F",
  stakeholder: "#7C3AED",
};
const ROLE_OPTIONS: { key: Role; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "enumerator", label: "Enumerator" },
  { key: "stakeholder", label: "Stakeholder" },
];

export function TopBar() {
  const { state, actions } = usePortal();
  const userName = USER_NAMES[state.role];

  return (
    <header className="z-30 flex h-[60px] flex-none items-center gap-[18px] border-b border-line bg-white px-[18px]">
      <div className="flex w-[236px] flex-none items-center gap-[11px]">
        <LogoMark size={30} />
        <div className="leading-[1.05]">
          <div className="text-[15px] font-extrabold tracking-[-.3px]">Prodi-Surveys</div>
          <div className="text-[10px] font-semibold tracking-[.3px] text-gray-400">
            Survey Operations
          </div>
        </div>
      </div>

      <div className="relative max-w-[420px] flex-1">
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
          className="absolute left-3 top-1/2 -translate-y-1/2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" strokeLinecap="round" />
        </svg>
        <input
          value={state.search}
          onChange={(e) => actions.setSearch(e.target.value)}
          placeholder="Search respondents, orgs, referral codes…"
          className="h-[38px] w-full rounded-[9px] border border-line bg-[#FAFAFA] pl-9 pr-3.5 text-[13.5px] text-brand-ink outline-none"
        />
      </div>

      <div className="flex-1" />

      <button
        onClick={actions.launchFlow}
        className="flex h-[38px] items-center gap-[7px] rounded-[9px] border border-line bg-white px-3.5 text-[13px] font-semibold text-gray-700"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6" />
          <path d="M10 14L21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
        Respondent flow
      </button>

      <div className="flex items-center gap-0.5 rounded-[10px] bg-gray-100 p-[3px]">
        {ROLE_OPTIONS.map((ro) => {
          const active = state.role === ro.key;
          return (
            <button
              key={ro.key}
              onClick={() => actions.setRole(ro.key)}
              className={cx(
                "h-[30px] rounded-lg px-3 text-xs font-bold",
                active ? "bg-white text-brand-ink shadow-[0_1px_3px_rgba(0,0,0,.12)]" : "text-zinc-500",
              )}
            >
              {ro.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-[9px] pl-1.5">
        <Avatar
          initials={initials(userName).toUpperCase()}
          bg={ROLE_AVATAR_BG[state.role]}
          size={34}
          radius={999}
          fontSize={13}
        />
        <div className="max-w-[130px] leading-[1.15]">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-bold">
            {userName}
          </div>
          <div className="text-[11px] font-medium text-gray-400">{ROLE_LABEL[state.role]}</div>
        </div>
        <button
          onClick={actions.logout}
          title="Sign out"
          className="ml-1 flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] border border-line bg-white text-gray-400 hover:border-[#F3D0D0] hover:bg-red-50 hover:text-red-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
