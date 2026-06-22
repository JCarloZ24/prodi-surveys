"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { AuthShell, authButtonClass } from "@/components/portal/AuthShell";

export function PendingView({
  status,
  rejectedReason,
}: {
  status: "pending" | "rejected";
  rejectedReason?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setLoading(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/portal/login");
    router.refresh();
  };

  const rejected = status === "rejected";

  return (
    <AuthShell>
      <div className="mb-7">
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] text-[22px] font-black"
          style={
            rejected
              ? { background: "#FEE2E2", color: "#DC2626" }
              : { background: "#FEF3C7", color: "#D97706" }
          }
        >
          {rejected ? "✕" : "⏳"}
        </div>
        <h2 className="text-[26px] font-extrabold tracking-[-0.6px] text-[#18181B]">
          {rejected ? "Account not approved" : "Awaiting approval"}
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-[1.6] text-gray-500">
          {rejected ? (
            <>
              Your account request was not approved.
              {rejectedReason ? <> Reason: {rejectedReason}.</> : null} Please contact an
              administrator if you believe this is a mistake.
            </>
          ) : (
            <>
              Your email is verified. An administrator now needs to approve your account before
              you can access the dashboard. You&apos;ll be able to sign in once approved.
            </>
          )}
        </p>
      </div>

      <button type="button" onClick={signOut} disabled={loading} className={authButtonClass}>
        {loading ? "Signing out…" : "Sign out"}
      </button>
    </AuthShell>
  );
}
