"use client";

import { usePortal } from "@/lib/store";
import { classify } from "@/lib/classify";
import { surveyDef, qCount } from "@/lib/survey";
import { tok, bon } from "@/lib/selectors";
import { code, hash, peso, typePillClass, typeShort } from "@/lib/format";
import { LogoMark } from "@/lib/icons";
import { cx } from "@/lib/cx";
import { FlowNav } from "./FlowNav";
import { ProfileStep } from "./ProfileStep";
import { SurveyStep } from "./SurveyStep";

// Wizard step numbers (the gaps are intentional — they mirror the design's
// branching, where Handoff(4) sits between Verify and Survey and survey-only
// respondents enter at Survey(5)):
//   0 Welcome · 1 Profile · 2 Register · 3 Verify · 4 Handoff
//   5 Survey · 6 Selfie · 7 Payout · 8 Review · 9 Success
export function RespondentFlow() {
  const { state, actions } = usePortal();
  const step = state.rStep;

  // Progress indicator: survey-only respondents only ever see Survey onward,
  // and the Payout pip drops out when no token is offered.
  const stepDefs: [string, number][] = [];
  if (!state.surveyOnly) stepDefs.push(["Profile", 1], ["Register", 2], ["Verify", 3]);
  stepDefs.push(["Survey", 5], ["Selfie", 6]);
  if (state.payoutOn) stepDefs.push(["Payout", 7]);
  stepDefs.push(["Submit", 8]);
  const showSteps = state.surveyOnly ? step >= 5 && step <= 8 : step >= 1 && step <= 8;

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
            {stepDefs.map(([label, t], i) => {
              const done = step > t;
              const active = step === t;
              return (
                <div key={label} className="flex flex-1 items-center gap-[5px]">
                  <div
                    className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold"
                    style={{
                      background: done ? "#15803D" : active ? "#E0195F" : "#E7E7EA",
                      color: done || active ? "#fff" : "#9CA3AF",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span
                    className="whitespace-nowrap text-[11.5px] font-semibold"
                    style={{ color: active ? "#18181B" : done ? "#15803D" : "#9CA3AF" }}
                  >
                    {label}
                  </span>
                  {i < stepDefs.length - 1 && (
                    <div
                      className="mx-1 h-0.5 flex-1 rounded-sm"
                      style={{ background: step > t ? "#15803D" : "#E7E7EA" }}
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
          {step === 1 && <ProfileStep />}
          {step === 2 && <Register />}
          {step === 3 && <Otp />}
          {step === 4 && <Handoff />}
          {step === 5 && <SurveyStep />}
          {step === 6 && <Selfie />}
          {step === 7 && <Payout />}
          {step === 8 && <Review />}
          {step === 9 && <Success />}
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
              <span className="text-brand-pink">●</span>
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
        <div className="border-t border-[#F2F2F4] pt-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <span className="mb-[3px] block text-[13px] font-bold text-gray-700">
                Provide a token / payout for this respondent?
              </span>
              <span className="text-[11.5px] leading-[1.45] text-gray-400">
                Enumerators can choose whether to offer the incentive. If off, no payout step is
                shown and no token is owed.
              </span>
            </div>
            <div className="flex flex-none gap-0.5 rounded-[9px] bg-gray-100 p-[3px]">
              {([["Yes", true], ["No", false]] as [string, boolean][]).map(([label, val]) => {
                const active = state.payoutOn === val;
                return (
                  <button
                    key={label}
                    onClick={() => actions.setPayoutOn(val)}
                    className="h-[30px] rounded-[7px] px-[15px] text-[12.5px] font-bold"
                    style={{
                      background: active ? "#fff" : "transparent",
                      color: active ? (val ? "#15803D" : "#B91C1C") : "#71717A",
                      boxShadow: active ? "0 1px 2px rgba(0,0,0,.12)" : "none",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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

function Handoff() {
  const { state, actions } = usePortal();
  const picking = state.handoffMode !== "link";
  const who = (state.reg.name || "").trim() || "the respondent";
  const surveyLink =
    "surveys.prodigitality.net/s/PS-" + code(hash(state.reg.email || state.reg.name || "survey"));

  return (
    <div>
      <div className="mb-[22px] text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mb-2 text-[22px] font-extrabold tracking-[-.5px]">Email verified</h1>
        <p className="mx-auto max-w-[430px] text-[13.5px] text-gray-500">
          How should <b className="text-gray-700">{who}</b> complete the survey?
        </p>
      </div>

      {picking ? (
        <>
          <div className="flex flex-col gap-3">
            <div
              onClick={actions.handoffAssisted}
              className="flex cursor-pointer items-start gap-3.5 rounded-2xl border-[1.5px] border-line bg-white p-[18px] hover:border-brand-pink hover:bg-brand-pinkSoft2"
            >
              <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] bg-brand-pinkSoft text-brand-pink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="3.2" />
                  <path d="M3 20a6 6 0 0 1 12 0" />
                  <path d="M17 11l2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="mb-[3px] text-[14.5px] font-bold">I&apos;ll assist them now</div>
                <div className="text-[12.5px] leading-[1.5] text-gray-400">
                  Stay with the respondent and fill out the survey together in this session
                  (enumerator-assisted).
                </div>
              </div>
              <svg className="mt-3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4C4CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>

            <div
              onClick={actions.handoffSendLink}
              className="flex cursor-pointer items-start gap-3.5 rounded-2xl border-[1.5px] border-line bg-white p-[18px] hover:border-brand-pink hover:bg-brand-pinkSoft2"
            >
              <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px] bg-indigo-50 text-indigo-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
                  <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="mb-[3px] text-[14.5px] font-bold">Send them a self-service link</div>
                <div className="text-[12.5px] leading-[1.5] text-gray-400">
                  The respondent completes the survey on their own device. They&apos;ll only see the
                  survey — not the profile, registration, or verification steps.
                </div>
              </div>
              <svg className="mt-3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4C4CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={actions.flowBack}
              className="h-11 w-full rounded-[11px] border border-[#E2E2E6] bg-white text-[13.5px] font-bold text-gray-700"
            >
              Back
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="rounded-md bg-green-100 px-2.5 py-[3px] text-[11px] font-bold text-green-700">
              LINK READY
            </span>
            <span className="text-[12.5px] text-gray-400">Survey-only · expires in 7 days</span>
          </div>
          <p className="my-2.5 mb-3 text-[13px] leading-[1.55] text-gray-500">
            Share this link with {who}. Opening it shows only the survey — none of the earlier steps.
          </p>
          <div className="mb-4 flex items-center gap-2 rounded-[9px] border border-line2 bg-muted px-[13px] py-[11px]">
            <span className="flex-1 break-all font-mono text-[13px] text-gray-700">{surveyLink}</span>
            <button
              onClick={actions.copySurveyLink}
              className="rounded-[7px] bg-brand-pink px-[13px] py-[7px] text-[11.5px] font-bold text-white"
            >
              Copy
            </button>
          </div>
          <button
            onClick={actions.previewSurveyOnly}
            className="mb-2.5 h-[46px] w-full rounded-[11px] bg-brand-ink text-sm font-bold text-white"
          >
            Preview the respondent&apos;s survey-only view
          </button>
          <button
            onClick={actions.handoffDone}
            className="h-11 w-full rounded-[11px] border border-[#E2E2E6] bg-white text-[13.5px] font-bold text-gray-700"
          >
            Done — back to portal
          </button>
        </div>
      )}
    </div>
  );
}

function Selfie() {
  const { state, actions } = usePortal();
  const done = state.selfie;
  const methodLabel = state.selfieMethod === "upload" ? "Image uploaded" : "Selfie captured";

  const methodBtn = (active: boolean) =>
    cx(
      "flex h-[46px] items-center justify-center gap-2 rounded-[11px] border-[1.5px] text-[13.5px] font-bold",
      active ? "border-brand-pink bg-brand-pinkSoft text-[#9D174D]" : "border-[#E2E2E6] bg-white text-gray-700",
    );

  return (
    <div className="pt-2 text-center">
      <h1 className="mb-2 text-[22px] font-extrabold tracking-[-.5px]">Identity selfie</h1>
      <p className="mx-auto mb-6 max-w-[420px] text-[13.5px] text-gray-500">
        A quick selfie confirms a real person completed this survey. Used for audit &amp; quality
        control only.
      </p>
      <div
        className="mx-auto flex h-[180px] w-full max-w-[320px] items-center justify-center rounded-2xl border-2 border-dashed"
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
            <div className="text-sm font-bold text-green-700">{methodLabel}</div>
            <div className="mt-[3px] text-[12px] text-gray-400">Identity image attached</div>
          </div>
        ) : (
          <div className="text-center">
            <svg className="mx-auto" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="11" r="3.4" />
              <path d="M5 20a7 7 0 0 1 14 0" />
              <path d="M9 4h6l1 2h2a2 2 0 0 1 2 2" />
            </svg>
            <div className="mt-3 text-[13.5px] font-semibold text-gray-500">No image yet</div>
          </div>
        )}
      </div>
      <div className="mx-auto mt-4 grid max-w-[360px] grid-cols-2 gap-2.5">
        <button onClick={actions.takeSelfie} className={methodBtn(state.selfieMethod === "camera")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Take a selfie
        </button>
        <button onClick={actions.uploadSelfie} className={methodBtn(state.selfieMethod === "upload")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M17 8l-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
          Upload an image
        </button>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3.5 text-[11.5px] text-gray-400">
        <span>🔒 Timestamp recorded</span>
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
    [
      "Selfie",
      state.selfie
        ? "✓ " + (state.selfieMethod === "upload" ? "Image uploaded" : "Selfie taken")
        : "Not yet",
    ],
    ["Mode", state.surveyOnly ? "Self-service link" : "Enumerator-assisted"],
  ];
  if (state.payoutOn) {
    items.push(["Payout method", state.payout.method], ["Token", peso(tok(state.incentives, state.rType))]);
  } else {
    items.push(["Token / payout", "Not offered"]);
  }

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
  const tokenLabel = state.payoutOn ? peso(tok(state.incentives, state.rType)) : "No token";
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
          <span className="font-bold">{tokenLabel}</span>
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
