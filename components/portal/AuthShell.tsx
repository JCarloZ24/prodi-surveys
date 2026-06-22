import { LogoMark } from "@/lib/icons";

// Shared split-screen shell for portal auth pages (login / signup / verify /
// pending). The marketing panel mirrors the original login design.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:flex-col lg:w-[46%] xl:w-[44%] relative overflow-hidden"
        style={{ background: "linear-gradient(155deg, #16083A 0%, #2E1357 55%, #1B0B44 100%)" }}
      >
        <div
          className="pointer-events-none absolute top-[30%] right-[-80px] h-[480px] w-[480px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #8B2FC9 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-[10%] left-[-60px] h-[300px] w-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #E0195F 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex h-full flex-col p-12">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-[15px] font-extrabold tracking-[-0.3px] text-white/90">
              Prodi-Surveys
            </span>
          </div>

          <div className="my-auto pt-8">
            <h1 className="text-[38px] font-extrabold leading-[1.1] tracking-[-1px] text-white">
              Survey verification &<br />fieldwork operations
            </h1>
            <p className="mt-4 max-w-[320px] text-[14.5px] leading-[1.65] text-white/50">
              Register, verify, and track every respondent — with selfie checks, QA review,
              referral tracking, and a full audit trail.
            </p>
          </div>

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
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <LogoMark size={24} />
            <span className="text-[14px] font-extrabold text-[#18181B]">Prodi-Surveys</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// Shared input styling used across the auth forms.
export const authInputClass =
  "h-11 w-full rounded-[10px] border border-[#E4E4E7] bg-[#FAFAFA] px-3.5 text-[13.5px] text-[#18181B] placeholder:text-gray-400 transition-colors focus:border-[#18181B] focus:bg-white focus:outline-none";

export const authButtonClass =
  "h-11 w-full rounded-[10px] bg-[#18181B] text-[13.5px] font-bold text-white transition-opacity disabled:opacity-40";
