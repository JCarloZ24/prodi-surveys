"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { cx } from "@/lib/cx";
import { isValidSlug, slugSuggestions } from "@/lib/slug";
import { PAYOUT_METHODS, payoutError, payoutNumberLabel } from "@/lib/payout";
import { AuthShell, authInputClass, authButtonClass } from "@/components/portal/AuthShell";
import { VerifyEmailFields } from "@/components/portal/VerifyEmailForm";
import type { PayoutDetails } from "@/lib/types";

type Props = {
  role: "enumerator" | "stakeholder";
  title: string;
  subtitle: string;
  // Optional role-specific field (region for enumerators, organization for stakeholders).
  extraField?: { key: "region" | "organization"; label: string; placeholder: string };
};

type StepKey = "details" | "payout" | "slug" | "verify";
type SlugStatus = "idle" | "checking" | "available" | "taken";

export function SignupForm({ role, title, subtitle, extraField }: Props) {
  const router = useRouter();

  const steps: { key: StepKey; label: string }[] =
    role === "enumerator"
      ? [
          { key: "details", label: "Details" },
          { key: "payout", label: "Payout" },
          { key: "slug", label: "Handle" },
          { key: "verify", label: "Verify" },
        ]
      : [
          { key: "details", label: "Details" },
          { key: "verify", label: "Verify" },
        ];

  const [step, setStep] = useState(0);
  const current = steps[step].key;
  const verifyIndex = steps.length - 1;
  const isLastInfoStep = step === steps.length - 2;

  // Shared form state.
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [extra, setExtra] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [payout, setPayout] = useState<PayoutDetails>({ method: "", acctName: "", acctNum: "", bank: "" });
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const suggestions = useMemo(() => slugSuggestions(fullName), [fullName]);

  const slugTrimmed = slug.toLowerCase().trim();
  const slugFormatValid = isValidSlug(slugTrimmed);
  const slugReady = slugFormatValid && slugStatus === "available";

  // Debounced live slug availability check.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      if (current !== "slug" || !slugTrimmed || !slugFormatValid) {
        setSlugStatus("idle");
        return;
      }
      setSlugStatus("checking");
      timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/auth/slug-check?slug=${encodeURIComponent(slugTrimmed)}`);
          const data = await res.json();
          if (active) setSlugStatus(data.available ? "available" : "taken");
        } catch {
          if (active) setSlugStatus("idle");
        }
      }, 400);
    };
    run();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [slugTrimmed, slugFormatValid, current]);

  const detailsValid =
    !!fullName && !!email && !!mobile && password.length >= 8 && password === confirmPassword;
  const payoutValid = payoutError(payout) === null;

  const continueDisabled =
    loading ||
    (current === "details" && !detailsValid) ||
    (current === "payout" && !payoutValid) ||
    (current === "slug" && !slugReady);

  const submitAccount = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          full_name: fullName,
          email,
          mobile,
          password,
          ...(extraField ? { [extraField.key]: extra } : {}),
          ...(role === "enumerator" ? { slug: slugTrimmed, payout_details: payout } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign-up failed");
        if (res.status === 409 && /handle/i.test(data.error ?? "")) setSlugStatus("taken");
        return;
      }

      // Sign in so the verification + pending gates can read the session.
      const supabase = createBrowserSupabase();
      await supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password });

      setStep(verifyIndex);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setError("");
    if (current === "details") {
      if (!detailsValid) return;
      if (isLastInfoStep) return submitAccount(); // stakeholder
      return setStep(step + 1);
    }
    if (current === "payout") {
      const err = payoutError(payout);
      if (err) return setError(err);
      if (!slug && suggestions[0]) setSlug(suggestions[0]); // prefill handle
      return setStep(step + 1);
    }
    if (current === "slug") {
      if (!slugReady) return setError("Choose an available handle.");
      return submitAccount(); // enumerator
    }
  };

  const numberLabel = payoutNumberLabel(payout.method);

  return (
    <AuthShell>
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-1.5">
        {steps.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-1.5">
            <div
              className={cx(
                "flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-extrabold",
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-[#18181B] text-white"
                    : "bg-gray-100 text-gray-400",
              )}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={cx("text-[11.5px] font-semibold", i === step ? "text-[#18181B]" : "text-gray-400")}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-gray-200" />}
          </div>
        ))}
      </div>

      {current === "verify" ? (
        <VerifyEmailFields
          email={email}
          onVerified={() => {
            router.push("/portal/pending");
            router.refresh();
          }}
        />
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-[24px] font-extrabold tracking-[-0.6px] text-[#18181B]">{title}</h2>
            <p className="mt-1.5 text-[13.5px] text-gray-500">{subtitle}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleContinue();
            }}
            className="space-y-4"
          >
            {current === "details" && (
              <>
                <Field label="Full name">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan dela Cruz"
                    autoComplete="name"
                    className={authInputClass}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={authInputClass}
                  />
                </Field>
                <Field label="Mobile number">
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="09XX XXX XXXX"
                    autoComplete="tel"
                    className={authInputClass}
                  />
                </Field>
                {extraField && (
                  <Field label={extraField.label}>
                    <input
                      type="text"
                      value={extra}
                      onChange={(e) => setExtra(e.target.value)}
                      placeholder={extraField.placeholder}
                      className={authInputClass}
                    />
                  </Field>
                )}
                <Field label="Password">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className={authInputClass}
                  />
                </Field>
                <Field label="Confirm password">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={cx(authInputClass, passwordsMismatch && "border-red-300 bg-red-50")}
                  />
                  {passwordsMismatch && (
                    <p className="mt-1 text-[12px] font-semibold text-red-600">Passwords do not match.</p>
                  )}
                </Field>
              </>
            )}

            {current === "payout" && (
              <>
                <p className="text-[12.5px] text-gray-500">
                  How should we send your enumerator compensation?
                </p>
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Method</label>
                  <div className="flex flex-wrap gap-2">
                    {PAYOUT_METHODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayout((p) => ({ ...p, method: m }))}
                        className={cx(
                          "rounded-[9px] border px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
                          payout.method === m
                            ? "border-[#18181B] bg-[#18181B] text-white"
                            : "border-[#E4E4E7] bg-white text-gray-600 hover:border-gray-300",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Account name">
                  <input
                    type="text"
                    value={payout.acctName}
                    onChange={(e) => setPayout((p) => ({ ...p, acctName: e.target.value }))}
                    placeholder="Name on the account"
                    className={authInputClass}
                  />
                </Field>
                <Field label={numberLabel}>
                  <input
                    type="text"
                    value={payout.acctNum}
                    onChange={(e) => setPayout((p) => ({ ...p, acctNum: e.target.value }))}
                    placeholder={payout.method === "Bank transfer" ? "Account number" : "09XX XXX XXXX"}
                    className={authInputClass}
                  />
                </Field>
                {payout.method === "Bank transfer" && (
                  <Field label="Bank name">
                    <input
                      type="text"
                      value={payout.bank}
                      onChange={(e) => setPayout((p) => ({ ...p, bank: e.target.value }))}
                      placeholder="e.g. BDO"
                      className={authInputClass}
                    />
                  </Field>
                )}
              </>
            )}

            {current === "slug" && (
              <>
                <p className="text-[12.5px] text-gray-500">
                  Pick a unique handle for your referral link. Choose a suggestion or type your own.
                </p>
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlug(s)}
                        className={cx(
                          "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                          slugTrimmed === s
                            ? "border-[#18181B] bg-[#18181B] text-white"
                            : "border-[#E4E4E7] bg-white text-gray-600 hover:border-gray-300",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <Field label="Your handle">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="your-handle"
                    autoCapitalize="none"
                    autoComplete="off"
                    className={cx(
                      authInputClass,
                      slugTrimmed && !slugFormatValid && "border-red-300 bg-red-50",
                      slugStatus === "taken" && "border-red-300 bg-red-50",
                      slugStatus === "available" && "border-emerald-300 bg-emerald-50",
                    )}
                  />
                  <div className="mt-1 flex items-center justify-between text-[12px]">
                    <span className="font-mono text-gray-400">…/r/{slugTrimmed || "your-handle"}</span>
                    <span
                      className={cx(
                        "font-semibold",
                        slugStatus === "available" && "text-emerald-600",
                        slugStatus === "taken" && "text-red-600",
                        slugStatus === "checking" && "text-gray-400",
                      )}
                    >
                      {slugTrimmed && !slugFormatValid
                        ? "Invalid format"
                        : slugStatus === "checking"
                          ? "Checking…"
                          : slugStatus === "available"
                            ? "✓ Available"
                            : slugStatus === "taken"
                              ? "✕ Taken"
                              : ""}
                    </span>
                  </div>
                </Field>
              </>
            )}

            {error && (
              <div className="rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-semibold text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(step - 1);
                  }}
                  disabled={loading}
                  className="h-11 rounded-[10px] border border-[#E4E4E7] px-4 text-[13.5px] font-bold text-gray-600 hover:bg-[#F7F7F8] disabled:opacity-40"
                >
                  Back
                </button>
              )}
              <button type="submit" disabled={continueDisabled} className={cx(authButtonClass, "flex-1")}>
                {loading
                  ? "Please wait…"
                  : isLastInfoStep
                    ? "Create account"
                    : "Continue"}
              </button>
            </div>
          </form>

          {step === 0 && (
            <p className="mt-6 text-center text-[13px] text-gray-500">
              Already have an account?{" "}
              <Link href="/portal/login" className="font-bold text-[#18181B] hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </>
      )}
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  );
}
