import { LogoMark } from "@/lib/icons";

// Shown when /s/<slug> doesn't resolve to an approved enumerator.
export function InvalidSurveyLink() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F6F7] px-6">
      <div className="w-full max-w-[420px] rounded-[18px] border border-[#E4E4E7] bg-white p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#FEE2E2] text-[22px] font-black text-[#DC2626]">
          ✕
        </div>
        <div className="mb-2 flex items-center justify-center gap-2">
          <LogoMark size={20} />
          <span className="text-[13px] font-extrabold text-[#18181B]">Prodi-Surveys</span>
        </div>
        <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#18181B]">
          This survey link is invalid
        </h1>
        <p className="mt-2 text-[13.5px] leading-[1.6] text-gray-500">
          The link you followed doesn&apos;t match an active enumerator. Please
          double-check the link, or contact the enumerator who shared it with you.
        </p>
      </div>
    </div>
  );
}
