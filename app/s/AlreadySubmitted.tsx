import { LogoMark } from "@/lib/icons";

// Shown when a self-service link points to a submission that's already completed,
// so the respondent who revisits the link gets a friendly confirmation rather than
// the generic "invalid link" page.
export function AlreadySubmitted() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F6F7] px-6">
      <div className="w-full max-w-[420px] rounded-[18px] border border-[#E4E4E7] bg-white p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#DCFCE7] text-[22px] font-black text-[#15803D]">
          ✓
        </div>
        <div className="mb-2 flex items-center justify-center gap-2">
          <LogoMark size={20} />
          <span className="text-[13px] font-extrabold text-[#18181B]">Prodi-Surveys</span>
        </div>
        <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#18181B]">
          This survey is already submitted
        </h1>
        <p className="mt-2 text-[13.5px] leading-[1.6] text-gray-500">
          Our records show this survey has already been completed and is now pending
          QA review. You don&apos;t need to do anything else — thank you! If you think
          this is a mistake, contact the enumerator who shared the link.
        </p>
      </div>
    </div>
  );
}
