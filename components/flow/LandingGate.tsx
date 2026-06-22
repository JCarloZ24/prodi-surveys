"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/lib/icons";

interface EnumeratorOption {
  id: string;
  full_name: string;
  slug: string;
}

export function LandingGate() {
  const router = useRouter();

  const [role, setRole] = useState<"enumerator" | "respondent" | null>(null);
  const [enumerators, setEnumerators] = useState<EnumeratorOption[]>([]);
  const [selected, setSelected] = useState<EnumeratorOption | null>(null);
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
    if (!selected?.slug) return;
    router.push(`/s/${selected.slug}`);
  }

  function initials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#F0F0F3]">
      <header className="flex h-[60px] flex-none items-center gap-3 border-b border-[#E2E2E6] bg-white px-5">
        <LogoMark size={26} />
        <div className="text-[14.5px] font-extrabold tracking-[-.3px]">Prodi-Surveys</div>
      </header>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-5 pt-12">
        <div className="w-full max-w-[440px] pb-20">

          {/* Hero */}
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-[20px] shadow-lg"
              style={{ background: "linear-gradient(135deg,#F0246A,#FB923C)" }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h1 className="mb-2 text-[24px] font-extrabold tracking-[-.5px] text-[#18181B]">
              Welcome to Prodi-Surveys
            </h1>
            <p className="text-[13.5px] leading-[1.6] text-gray-500">
              {role === "respondent"
                ? "Select your enumerator to get a personalized survey link."
                : "Are you an enumerator managing respondents, or a respondent taking the survey?"}
            </p>
          </div>

          {/* Role cards */}
          {role === null && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/portal/login")}
                className="group flex w-full items-center gap-4 rounded-2xl border border-[#E2E2E6] bg-white p-5 text-left transition-all hover:border-[#818CF8] hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px] transition-transform group-hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#818CF8)" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-[#18181B]">I&apos;m an Enumerator</div>
                  <div className="mt-0.5 text-[12.5px] leading-[1.5] text-gray-400">Go to the staff portal to manage respondents</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4C4CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-none transition-transform group-hover:translate-x-0.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              <button
                onClick={() => setRole("respondent")}
                className="group flex w-full items-center gap-4 rounded-2xl border border-[#E2E2E6] bg-white p-5 text-left transition-all hover:border-[#F472B6] hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px] transition-transform group-hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#E0195F,#FB923C)" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-[#18181B]">I&apos;m a Respondent</div>
                  <div className="mt-0.5 text-[12.5px] leading-[1.5] text-gray-400">Take the Prodigitality baseline survey</div>
                </div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4C4CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-none transition-transform group-hover:translate-x-0.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          )}

          {/* Respondent enumerator picker */}
          {role === "respondent" && (
            <div className="rounded-2xl border border-[#E2E2E6] bg-white shadow-sm">
              {/* Card header */}
              <div className="border-b border-[#F0F0F3] px-5 py-4">
                <button
                  onClick={() => { setRole(null); setSelected(null); }}
                  className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 transition-colors hover:text-gray-600"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Back
                </button>
                <div className="text-[14px] font-bold text-[#18181B]">Who is your enumerator?</div>
                <div className="mt-0.5 text-[12px] text-gray-400">Your survey link is unique to your enumerator.</div>
              </div>

              <div className="p-5">
                {/* Enumerator list */}
                {loading ? (
                  <div className="flex h-[42px] items-center justify-center rounded-[10px] border border-[#E2E2E6] px-3 text-[13px] text-gray-400">
                    Loading…
                  </div>
                ) : enumerators.length === 0 ? (
                  <div className="flex h-[42px] items-center justify-center rounded-[10px] border border-[#E2E2E6] px-3 text-[13px] text-gray-400">
                    No enumerators available
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {enumerators.map((e) => {
                      const isSelected = selected?.id === e.id;
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelected(e)}
                          className={[
                            "flex w-full items-center gap-3 rounded-[12px] border p-3 text-left transition-all",
                            isSelected
                              ? "border-[#E0195F] bg-[#FFF1F5] shadow-sm"
                              : "border-[#E2E2E6] bg-white hover:border-[#F9A8C9] hover:bg-[#FFF8FB]",
                          ].join(" ")}
                        >
                          <div
                            className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[11.5px] font-bold text-white"
                            style={{ background: isSelected ? "#E0195F" : "linear-gradient(135deg,#E0195F,#FB923C)" }}
                          >
                            {initials(e.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-[13.5px] font-semibold text-[#18181B]">{e.full_name}</div>
                            <div className="text-[11px] text-gray-400">prodigitalitydata.live/s/{e.slug}</div>
                          </div>
                          {isSelected && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E0195F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={handleStartSurvey}
                  disabled={!selected}
                  className="mt-4 h-[46px] w-full rounded-[12px] text-[14px] font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-35"
                  style={{ background: "#E0195F" }}
                >
                  Start survey →
                </button>

                {selected && (
                  <p className="mt-3 text-center text-[11.5px] text-gray-400">
                    You&apos;ll be redirected to{" "}
                    <span className="font-mono font-semibold text-gray-500">
                      /s/{selected.slug}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
