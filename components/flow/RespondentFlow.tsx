"use client";

import { usePortal } from "@/lib/store";
import { classify } from "@/lib/classify";
import { surveyDef, qCount } from "@/lib/survey";
import { tok, bon } from "@/lib/selectors";
import { peso, typePillClass, typeShort } from "@/lib/format";
import { LogoMark } from "@/lib/icons";
import { cx } from "@/lib/cx";
import { FlowNav } from "./FlowNav";
import { ProfileStep } from "./ProfileStep";
import { SurveyStep } from "./SurveyStep";

const STEP_LABELS = ["Register", "Verify", "Profile", "Survey", "Selfie", "Payout", "Submit"];

export function RespondentFlow() {
  const { state, actions } = usePortal();
  const step = state.rStep;
  const showSteps = step >= 1 && step <= 7;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-surface">
      <header className="flex h-[60px] flex-none items-center gap-3.5 border-b border-line bg-white px-[22px]">
        <LogoMark size={28} />
        <div className="text-[15px] font-extrabold tracking-[-.3px]">Prodi-Surveys</div>
        <div className="flex-1" />
        <button onClick={actions.exitFlow} className="text-[12.5px] font-semibold text-gray-500">
          Exit survey ✕
        </button>
      </header>

      {showSteps && (
        <div className="flex flex-none justify-center border-b border-line2 bg-white px-[22px] py-3">
          <div className="flex w-full max-w-[760px] items-center gap-[5px]">
            {STEP_LABELS.map((label, i) => {
              const idx = i + 1;
              const done = step > idx;
              const active = step === idx;
              return (
                <div key={label} className="flex flex-1 items-center gap-[5px]">
                  <div
                    className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold"
                    style={{
                      background: done ? "#15803D" : active ? "#E0195F" : "#E7E7EA",
                      color: done || active ? "#fff" : "#9CA3AF",
                    }}
                  >
                    {done ? "✓" : idx}
                  </div>
                  <span
                    className="whitespace-nowrap text-[11.5px] font-semibold"
                    style={{ color: active ? "#18181B" : done ? "#15803D" : "#9CA3AF" }}
                  >
                    {label}
                  </span>
                  {i < 6 && (
                    <div
                      className="mx-1 h-0.5 flex-1 rounded-sm"
                      style={{ background: step > idx ? "#15803D" : "#E7E7EA" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-1 justify-center overflow-y-auto px-[22px] pb-[60px] pt-[34px]">
        <div className="w-full max-w-[620px]">
          {step === 0 && <Welcome />}
          {step === 1 && <Register />}
          {step === 2 && <Otp />}
          {step === 3 && <ProfileStep />}
          {step === 4 && <SurveyStep />}
          {step === 5 && <Selfie />}
          {step === 6 && <Payout />}
          {step === 7 && <Review />}
          {step === 8 && <Success />}
        </div>
      </div>
    </div>
  );
}

function Welcome() {
  const { state, actions } = usePortal();
  return (
    <div className="pt-[18px] text-center">
      <div
        className="mx-auto mb-[22px] flex h-16 w-16 items-center justify-center rounded-[18px]"
        style={{ background: "linear-gradient(135deg,#F0246A,#FB923C)" }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </div>
      <h1 className="mb-2.5 text-[26px] font-extrabold tracking-[-.6px]">Prodi-Surveys</h1>
      <p className="mx-auto mb-2 max-w-[460px] text-[14.5px] leading-[1.65] text-gray-500">
        You&apos;ve been invited to take part in a baseline data collection study. The survey takes
        about <b>5–10 minutes</b>.
      </p>
      {state.referredBy && (
        <div className="my-3.5 inline-flex items-center gap-2 rounded-[9px] border border-brand-pinkLine bg-brand-pinkSoft2 px-3.5 py-2 text-[13px] font-semibold text-[#9D174D]">
          Referred by {state.referredBy} · code {state.referredCode}
        </div>
      )}
      <div className="my-[22px] rounded-2xl border border-line bg-white p-[18px] text-left">
        <div className="mb-3 text-[12px] font-bold uppercase tracking-[.4px] text-gray-400">
          What you&apos;ll need
        </div>
        <div className="flex flex-col gap-[11px]">
          {[
            "A valid email address & mobile number",
            "A quick selfie for identity verification",
            "Your payout details (GCash, Maya, or bank)",
          ].map((t) => (
            <div key={t} className="flex items-center gap-[11px] text-[13.5px] text-gray-700">
              <span className="text-brand-pink">✓</span>
              {t}
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={actions.flowNext}
        className="h-12 w-full rounded-[11px] bg-brand-ink text-[15px] font-bold text-white"
      >
        Get started
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
  hint,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          "h-[42px] w-full rounded-[9px] border border-[#E2E2E6] px-[13px] text-[13.5px] outline-none",
          mono && "font-mono",
        )}
      />
      {hint && <span className="mt-1 block text-[11.5px] text-gray-400">{hint}</span>}
    </label>
  );
}

function Register() {
  const { state, actions } = usePortal();
  const reg = state.reg;
  return (
    <div>
      <h1 className="mb-1.5 text-[22px] font-extrabold tracking-[-.5px]">Register your details</h1>
      <p className="mb-[22px] text-[13.5px] text-gray-500">
        Register your details to participate in the Prodigitality baseline survey.
      </p>
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-[22px]">
        <Field label="Full name" value={reg.name} onChange={(v) => actions.setReg("name", v)} placeholder="Juan Dela Cruz" />
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Email address" value={reg.email} onChange={(v) => actions.setReg("email", v)} placeholder="you@email.com" />
          <Field label="Mobile number" value={reg.mobile} onChange={(v) => actions.setReg("mobile", v)} placeholder="+63 9XX XXX XXXX" />
        </div>
        <Field
          label={<>Referral code <span className="font-medium text-gray-400">· optional</span></>}
          value={reg.code}
          onChange={(v) => actions.setReg("code", v)}
          placeholder="e.g. PS-XXXX"
          mono
        />
      </div>
      <FlowNav nextLabel="Continue" />
    </div>
  );
}

function Otp() {
  const { state, actions } = usePortal();
  return (
    <div className="pt-3.5 text-center">
      <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-indigo-50">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      </div>
      <h1 className="mb-2 text-[22px] font-extrabold tracking-[-.5px]">Verify your email</h1>
      <p className="mb-1.5 text-[13.5px] text-gray-500">
        We sent a 6-digit code to <b className="text-gray-700">{state.reg.email || "your email"}</b>
      </p>
      <p className="mb-[22px] text-[12px] text-[#C084A6]">Demo: enter any 6 digits (e.g. 000000)</p>
      <input
        value={state.otp}
        onChange={(e) => actions.setOtp(e.target.value)}
        maxLength={6}
        placeholder="• • • • • •"
        className="mb-[18px] h-14 w-[240px] rounded-xl border border-[#E2E2E6] text-center font-mono text-2xl font-bold tracking-[10px] outline-none"
      />
      <div className="flex justify-center gap-2.5">
        <button
          onClick={actions.flowBack}
          className="h-[46px] rounded-[11px] border border-[#E2E2E6] bg-white px-[22px] text-sm font-bold text-gray-700"
        >
          Back
        </button>
        <button
          onClick={actions.verifyOtp}
          className="h-[46px] rounded-[11px] bg-brand-ink px-10 text-sm font-bold text-white"
        >
          Verify email
        </button>
      </div>
    </div>
  );
}

function Selfie() {
  const { state, actions } = usePortal();
  const done = state.selfie;
  return (
    <div className="pt-2 text-center">
      <h1 className="mb-2 text-[22px] font-extrabold tracking-[-.5px]">Identity selfie</h1>
      <p className="mx-auto mb-6 max-w-[420px] text-[13.5px] text-gray-500">
        A quick selfie confirms a real person completed this survey. Used for audit &amp; quality
        control only.
      </p>
      <div
        onClick={actions.toggleSelfie}
        className="mx-auto flex h-[200px] w-full max-w-[320px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed"
        style={{
          borderColor: done ? "#86EFAC" : "#D4D4D8",
          background: done ? "#F0FDF4" : "#FAFAFA",
        }}
      >
        {done ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-green-100">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="text-sm font-bold text-green-700">Selfie captured</div>
            <div className="mt-[3px] text-[12px] text-gray-400">Tap to retake</div>
          </div>
        ) : (
          <div className="text-center">
            <svg className="mx-auto" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <div className="mt-3 text-sm font-bold text-gray-700">Take or upload a selfie</div>
            <div className="mt-[3px] text-[12px] text-gray-400">Tap to simulate capture</div>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3.5 text-[11.5px] text-gray-400">
        <span>📍 Timestamp recorded</span>
        <span>IP &amp; device logged</span>
      </div>
      <div className="mt-6">
        <FlowNav disabled={!done} />
      </div>
    </div>
  );
}

const PAYOUT_METHODS = ["GCash", "Maya", "Bank transfer", "Other"];

function Payout() {
  const { state, actions } = usePortal();
  const p = state.payout;
  const isBank = p.method === "Bank transfer";
  const isEwallet = p.method === "GCash" || p.method === "Maya";
  return (
    <div>
      <h1 className="mb-1.5 text-[22px] font-extrabold tracking-[-.5px]">Payout details</h1>
      <p className="mb-[22px] text-[13.5px] text-gray-500">
        Where should we send your <b className="text-gray-700">{peso(tok(state.incentives, state.rType))}</b>{" "}
        token once verified?
      </p>
      <div className="flex flex-col gap-[18px] rounded-2xl border border-line bg-white p-[22px]">
        <div>
          <span className="mb-2 block text-[12px] font-bold text-gray-700">Payout method</span>
          <div className="grid grid-cols-4 gap-[9px]">
            {PAYOUT_METHODS.map((m) => {
              const active = p.method === m;
              return (
                <button
                  key={m}
                  onClick={() => actions.setPayout("method", m)}
                  className={cx(
                    "h-10 rounded-[9px] border text-[12.5px] font-bold",
                    active ? "border-brand-pink bg-brand-pinkSoft text-[#9D174D]" : "border-[#E2E2E6] bg-white text-zinc-500",
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {isEwallet && (
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Account name" value={p.acctName} onChange={(v) => actions.setPayout("acctName", v)} placeholder="Registered name" />
            <Field label="Mobile number" value={p.acctNum} onChange={(v) => actions.setPayout("acctNum", v)} placeholder="09XX XXX XXXX" />
          </div>
        )}
        {isBank && (
          <div className="flex flex-col gap-3.5">
            <Field label="Bank name" value={p.bank} onChange={(v) => actions.setPayout("bank", v)} placeholder="e.g. BDO, BPI" />
            <div className="grid grid-cols-2 gap-3.5">
              <Field label="Account name" value={p.acctName} onChange={(v) => actions.setPayout("acctName", v)} placeholder="Account holder" />
              <Field label="Account number" value={p.acctNum} onChange={(v) => actions.setPayout("acctNum", v)} placeholder="000000000" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-[9px] rounded-[9px] border border-brand-pinkLine bg-brand-pinkSoft2 px-[13px] py-[11px] text-[12px] text-[#9D174D]">
          <span>🔒</span>
          Payout details are visible only to authorized Prodigitality admins.
        </div>
      </div>
      <FlowNav nextLabel="Review & submit" />
    </div>
  );
}

function Review() {
  const { state, actions } = usePortal();
  const cls = classify(state.qual);
  const defs = surveyDef(state.rType).filter((q) => q.kind !== "section");
  const answered = defs.filter((q) => {
    const v = state.survey[q.id as string];
    if (v == null || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  }).length;

  const items: [string, string][] = [
    ["Name", state.reg.name || "—"],
    ["Email", state.reg.email || "—"],
    ["Mobile", state.reg.mobile || "—"],
    ["Survey path", typeShort(state.rType)],
    ["Qualification", cls.status],
    ["Referral source", state.qual.hearAbout || "—"],
    ["Survey", answered + " of " + qCount(state.rType) + " answered"],
    ["Selfie", state.selfie ? "✓ Captured" : "Not yet"],
    ["Payout", state.payout.method],
    ["Token", peso(tok(state.incentives, state.rType))],
  ];

  return (
    <div>
      <h1 className="mb-1.5 text-[22px] font-extrabold tracking-[-.5px]">Review &amp; submit</h1>
      <p className="mb-[22px] text-[13.5px] text-gray-500">
        Confirm everything looks right. Your submission then goes to QA review.
      </p>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-[#F2F2F4] px-[18px] py-[13px] last:border-0">
            <span className="flex-none text-[13px] font-semibold text-gray-400">{label}</span>
            <span className="break-words text-right text-[13px] font-semibold">{value}</span>
          </div>
        ))}
      </div>
      <FlowNav nextLabel="Submit for verification" onNext={actions.submitFlow} />
    </div>
  );
}

function Success() {
  const { state, actions } = usePortal();
  const thanks = (state.reg.name && state.reg.name.trim()) ? "Thanks, " + state.reg.name.trim() + "." : "Thanks!";
  return (
    <div className="pt-[18px] text-center">
      <div className="mx-auto mb-[22px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green-100">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1 className="mb-2.5 text-[26px] font-extrabold tracking-[-.6px]">Submitted!</h1>
      <p className="mx-auto mb-6 max-w-[440px] text-[14.5px] leading-[1.6] text-gray-500">
        {thanks} Your response is now <b className="text-orange-800">pending QA review</b>. You&apos;ll
        be notified once verified and your token is processed.
      </p>
      <div className="mb-3.5 rounded-2xl border border-line bg-white p-5 text-left">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="text-[12px] font-bold uppercase tracking-[.4px] text-gray-400">
            Your referral link
          </div>
          <span className={typePillClass(state.rType)}>{typeShort(state.rType)} path</span>
        </div>
        <p className="mb-3 text-[13px] leading-[1.55] text-gray-500">
          Refer others in your group and earn a bonus once they&apos;re verified.
        </p>
        <div className="flex items-center gap-2 rounded-[9px] border border-line2 bg-muted px-[13px] py-2.5">
          <span className="flex-1 break-all text-left font-mono text-[13px] text-gray-700">
            surveys.prodigitality.net/r/{state.newCode}
          </span>
          <button
            onClick={actions.copyReferral}
            className="rounded-[7px] bg-brand-pink px-[13px] py-[7px] text-[11.5px] font-bold text-white"
          >
            Copy
          </button>
        </div>
        <div className="mt-3.5 flex justify-between text-[13px]">
          <span className="font-semibold text-gray-400">Your token (after verify)</span>
          <span className="font-bold">{peso(tok(state.incentives, state.rType))}</span>
        </div>
        <div className="mt-[7px] flex justify-between text-[13px]">
          <span className="font-semibold text-gray-400">Referral bonus (per verified)</span>
          <span className="font-bold">{peso(bon(state.incentives, state.rType))}</span>
        </div>
        <div className="mt-[9px] text-[11px] text-[#B0B0B8]">
          Token &amp; bonus amounts depend on your respondent path.
        </div>
      </div>
      <button
        onClick={actions.previewReferral}
        className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[11px] bg-brand-ink text-sm font-bold text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
        </svg>
        Preview the referral link as a new respondent
      </button>
      <p className="mt-3.5 text-[12px] text-gray-400">You can now safely close this window.</p>
    </div>
  );
}
