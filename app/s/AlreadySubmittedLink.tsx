import { LogoMark } from "@/lib/icons";

// Shown when a self-service link (/s/<slug>/<code>) has already been used to submit.
export function AlreadySubmittedLink() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F6F7] px-6">
      <div className="w-full max-w-[420px] rounded-[18px] border border-[#E4E4E7] bg-white p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="mb-2 flex items-center justify-center gap-2">
          <LogoMark size={20} />
          <span className="text-[13px] font-extrabold text-[#18181B]">Prodi-Surveys</span>
        </div>
        <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#18181B]">
          This survey is already complete
        </h1>
        <p className="mt-2 text-[13.5px] leading-[1.6] text-gray-500">
          This link has already been used to submit a response. If you think this is a
          mistake, contact the enumerator who shared it with you.
        </p>
      </div>
    </div>
  );
}
