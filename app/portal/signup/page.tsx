import Link from "next/link";
import { AuthShell } from "@/components/portal/AuthShell";

const OPTIONS = [
  {
    href: "/portal/signup/enumerator",
    label: "Enumerator",
    description: "Field data collection & respondent assistance",
    initial: "E",
    color: "#E0195F",
  },
  {
    href: "/portal/signup/stakeholder",
    label: "Stakeholder",
    description: "Read-only dashboard & reports",
    initial: "S",
    color: "#0369A1",
  },
];

export default function SignupChooserPage() {
  return (
    <AuthShell>
      <div className="mb-7">
        <h2 className="text-[26px] font-extrabold tracking-[-0.6px] text-[#18181B]">Create an account</h2>
        <p className="mt-1.5 text-[13.5px] text-gray-500">
          Choose the type of account you need. An administrator will review and approve it.
        </p>
      </div>

      <div className="space-y-2">
        {OPTIONS.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="flex w-full items-center gap-3 rounded-[10px] border border-[#E4E4E7] bg-[#FAFAFA] px-3.5 py-3 text-left transition-all hover:border-[#18181B]"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
              style={{ background: o.color }}
            >
              {o.initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-[#18181B]">{o.label}</div>
              <div className="mt-0.5 text-[12px] text-gray-400">{o.description}</div>
            </div>
            <span className="ml-auto text-gray-300">→</span>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-center text-[13px] text-gray-500">
        Already have an account?{" "}
        <Link href="/portal/login" className="font-bold text-[#18181B] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
