import { LogoMark } from "@/lib/icons";

// Public landing page. The respondent survey now lives at
// /s/<enumerator-slug> — this root route is a placeholder landing for now.
export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(155deg, #16083A 0%, #2E1357 55%, #1B0B44 100%)" }}
    >
      <div className="flex items-center gap-2.5">
        <LogoMark size={34} />
        <span className="text-[20px] font-extrabold tracking-[-0.4px] text-white">
          Prodi-Surveys
        </span>
      </div>

      <h1 className="mt-8 max-w-[640px] text-[34px] font-extrabold leading-[1.1] tracking-[-1px] text-white sm:text-[44px]">
        Survey verification &amp; fieldwork operations
      </h1>
      <p className="mt-4 max-w-[460px] text-[14.5px] leading-[1.65] text-white/50">
        The Prodigitality baseline survey platform. Respondents take the survey
        through a link shared by their enumerator.
      </p>

      <div className="mt-10 rounded-full border border-white/15 px-4 py-1.5 text-[12px] font-semibold text-white/40">
        Landing page coming soon
      </div>
    </main>
  );
}
