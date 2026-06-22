"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/lib/store";
import { LogoMark } from "@/lib/icons";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface EnumeratorOption {
  id: string;
  full_name: string;
}

export function LandingGate() {
  const { actions } = usePortal();
  const router = useRouter();

  const [role, setRole] = useState<"enumerator" | "respondent" | null>(null);
  const [enumerators, setEnumerators] = useState<EnumeratorOption[]>([]);
  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role !== "respondent") return;
    setLoading(true);
    fetch("/api/enumerators")
      .then((r) => r.json())
      .then((d) => setEnumerators(d.enumerators ?? []))
      .catch(() => setEnumerators([]))
      .finally(() => setLoading(false));
  }, [role]);

  function handleStartSurvey() {
    if (!selectedName) return;
    actions.launchFlow();
    actions.setReg("enumerator", selectedName);
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#F0F0F3]">
      <header className="flex h-[60px] flex-none items-center gap-3.5 border-b border-[#E2E2E6] bg-white px-[22px]">
        <LogoMark size={28} />
        <div className="text-[15px] font-extrabold tracking-[-.3px]">Prodi-Surveys</div>
      </header>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-[22px] pt-[48px]">
        <div className="w-full max-w-[460px] pb-[80px]">
          <div className="mb-[28px] text-center">
            <div
              className="mx-auto mb-[18px] flex h-16 w-16 items-center justify-center rounded-[18px]"
              style={{ background: "linear-gradient(135deg,#F0246A,#FB923C)" }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h1 className="mb-2 text-[26px] font-extrabold tracking-[-.6px]">Welcome to Prodi-Surveys</h1>
            <p className="text-[14px] leading-[1.65] text-gray-500">
              Are you visiting as an enumerator or a survey respondent?
            </p>
          </div>

          {role === null && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/portal/login")}
                className="flex w-full items-center gap-4 rounded-2xl border border-[#E2E2E6] bg-white p-5 text-left transition-shadow hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px]"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#818CF8)" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-[#18181B]">I&apos;m an Enumerator</div>
                  <div className="text-[12.5px] leading-[1.5] text-gray-400">Go to the staff portal to manage respondents</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4C4CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              <button
                onClick={() => setRole("respondent")}
                className="flex w-full items-center gap-4 rounded-2xl border border-[#E2E2E6] bg-white p-5 text-left transition-shadow hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px]"
                  style={{ background: "linear-gradient(135deg,#E0195F,#FB923C)" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-[#18181B]">I&apos;m a Respondent</div>
                  <div className="text-[12.5px] leading-[1.5] text-gray-400">Take the Prodigitality baseline survey</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4C4CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          )}

          {role === "respondent" && (
            <div className="rounded-2xl border border-[#E2E2E6] bg-white p-[22px]">
              <button
                onClick={() => { setRole(null); setSelectedName(""); }}
                className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-400 hover:text-gray-600"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>

              <label className="block">
                <span className="mb-2 block text-[13px] font-bold text-gray-700">
                  Who is your enumerator?
                </span>
                {loading ? (
                  <div className="flex h-[42px] items-center rounded-[9px] border border-[#E2E2E6] px-3 text-[13px] text-gray-400">
                    Loading enumerators…
                  </div>
                ) : enumerators.length === 0 ? (
                  <div className="flex h-[42px] items-center rounded-[9px] border border-[#E2E2E6] px-3 text-[13px] text-gray-400">
                    No enumerators available
                  </div>
                ) : (
                  <CustomSelect
                    value={selectedName}
                    onChange={setSelectedName}
                    options={enumerators.map((e) => e.full_name)}
                    placeholder="Select an enumerator…"
                  />
                )}
              </label>

              <button
                onClick={handleStartSurvey}
                disabled={!selectedName}
                className="mt-5 h-[46px] w-full rounded-[12px] text-[14px] font-bold text-white transition-opacity disabled:opacity-40"
                style={{ background: selectedName ? "#E0195F" : "#E0195F" }}
              >
                Start survey →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
