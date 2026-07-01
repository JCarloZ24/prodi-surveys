"use client";

import { useState, useEffect, useRef } from "react";
import { usePortal } from "@/lib/store";
import { classify } from "@/lib/classify";
import { buildProfileData } from "@/lib/profile";
import { buildRegistrationData } from "@/lib/registration";
import { buildPayoutData, buildShippingData } from "@/lib/token";
import { typeShort, peso } from "@/lib/format";
import { LogoMark } from "@/lib/icons";
import { cx } from "@/lib/cx";
import { detectFaceCount, detectFaceInFrame } from "@/lib/faceDetect";
import { FlowNav } from "./FlowNav";
import { ProfileStep } from "./ProfileStep";
import { SurveyStep } from "./SurveyStep";

// Wizard step numbers (the gaps are intentional — Survey enters at 5). Step 3
// (Verify/OTP) is removed; step 4 is the collection-mode choice (enumerator-assisted
// vs self-service) shown after Register. Step 7 is the respondent token: a cash Payout
// step on SME/Agri-Tech, a free-token Shipping (tumbler) step on TSI.
//   0 Welcome · 1 Profile · 2 Register · 4 Mode · 5 Survey · 6 Selfie · 7 Token · 8 Review · 9 Success
// A self-service respondent resumes at 5 (Survey) and never sees 0–4.
export function RespondentFlow() {
  const { state, actions } = usePortal();
  const step = state.rStep;
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const tokenLabel = state.rType === "TSI" ? "Free token" : "Payout";
  // A self-service respondent resumes at the Survey step (Profile/Register/Mode were
  // done by the enumerator), so their stepper starts there.
  const stepDefs: [string, number][] = state.selfService
    ? [["Survey", 5], ["Selfie", 6], [tokenLabel, 7], ["Submit", 8]]
    : [["Profile", 1], ["Register", 2], ["Mode", 4], ["Survey", 5], ["Selfie", 6], [tokenLabel, 7], ["Submit", 8]];
  const showSteps = step >= 1 && step <= 8;
  const activeIdx = stepDefs.findIndex(([, t]) => step === t);
  const progressPct = stepDefs.length ? ((activeIdx + 1) / stepDefs.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-surface">
      <header className="flex h-[60px] flex-none items-center gap-3.5 border-b border-line bg-white px-[22px]">
        <LogoMark size={28} />
        <div className="text-[15px] font-extrabold tracking-[-.3px]">Prodi-Surveys</div>
        <div className="flex-1" />
        <button onClick={() => setShowExitConfirm(true)} className="text-[12.5px] font-semibold text-gray-500">
          Exit survey ✕
        </button>
      </header>

      {showSteps && (
        <div className="flex-none border-b border-line2 bg-white">
          {/* Mobile: active step label + progress bar (the full pip row can't fit) */}
          <div className="px-[22px] py-2.5 sm:hidden">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[13px] font-bold text-brand-ink">
                {stepDefs[activeIdx]?.[0] ?? ""}
              </span>
              <span className="text-[11.5px] font-semibold text-gray-400">
                Step {activeIdx + 1} of {stepDefs.length}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E7E7EA]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%`, background: "#E0195F" }}
              />
            </div>
          </div>
          {/* Desktop / tablet: full labeled pip stepper */}
          <div className="hidden justify-center px-[22px] py-3 sm:flex">
            <div className="flex w-full max-w-[760px] items-center gap-[5px]">
              {stepDefs.map(([label, t], i) => {
                const active = step === t;
                // A step is "completed" (green check) only once you've validly
                // advanced PAST it (t < furthest reached). Any step already reached
                // (t <= furthest reached) can be navigated to by clicking its pip —
                // forward or backward — so completing a step opens the next one.
                const done = t < state.rMaxStep && !active;
                const clickable = t <= state.rMaxStep && !active;
                return (
                  <div key={label} className="flex flex-1 items-center gap-[5px]">
                    <button
                      type="button"
                      onClick={clickable ? () => actions.goStep(t) : undefined}
                      disabled={!clickable}
                      title={clickable ? `Back to ${label}` : label}
                      className={cx(
                        "flex items-center gap-[5px] rounded-full transition-opacity",
                        clickable ? "cursor-pointer hover:opacity-70" : "cursor-default",
                      )}
                    >
                      <span
                        className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold"
                        style={{
                          background: done ? "#15803D" : active ? "#E0195F" : "#E7E7EA",
                          color: done || active ? "#fff" : "#9CA3AF",
                        }}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span
                        className="whitespace-nowrap text-[11.5px] font-semibold"
                        style={{ color: active ? "#18181B" : done ? "#15803D" : "#9CA3AF" }}
                      >
                        {label}
                      </span>
                    </button>
                    {i < stepDefs.length - 1 && (
                      <div
                        className="mx-1 h-0.5 flex-1 rounded-sm"
                        style={{ background: t < state.rMaxStep ? "#15803D" : "#E7E7EA" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div id="flow-scroll" className="flex-1 overflow-y-auto px-[22px] pt-[34px]">
        <div key={step} className="animate-flow-step mx-auto w-full max-w-[620px] pb-[120px]">
          {step === 0 && <Welcome />}
          {step === 1 && <ProfileStep />}
          {step === 2 && <Register />}
          {step === 4 && <ModeChoice />}
          {step === 5 && <SurveyStep />}
          {step === 6 && <Selfie />}
          {step === 7 && (state.rType === "TSI" ? <Shipping /> : <Payout />)}
          {step === 8 && <Review />}
          {step === 9 && <Success />}
        </div>
      </div>

      {showExitConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-5"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-2xl bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <span className="text-[26px] leading-none">⚠️</span>
            </div>
            <h2 className="mb-2 text-[18px] font-extrabold tracking-[-.3px]">Exit the survey?</h2>
            <p className="mb-5 text-[13.5px] leading-[1.55] text-gray-500">
              Your progress on this survey will be lost and you&apos;ll return to the start. This
              can&apos;t be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="h-11 flex-1 rounded-[11px] border border-[#E2E2E6] bg-white text-[13.5px] font-bold text-gray-700"
              >
                Keep going
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  actions.exitFlow();
                }}
                className="h-11 flex-1 rounded-[11px] bg-red-600 text-[13.5px] font-bold text-white"
              >
                Yes, exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Welcome() {
  const { state, actions } = usePortal();
  const agreeTerms = state.consentTerms;
  const agreePrivacy = state.consentPrivacy;
  const canStart = agreeTerms && agreePrivacy;
  const start = () => {
    if (!canStart) return;
    actions.confirmConsent();
    actions.flowNext();
  };
  return (
    <div className="pt-[18px]">
      <div className="text-center">
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
      </div>

      <div className="my-[22px] rounded-2xl border border-line bg-white p-[18px] text-left">
        <div className="mb-3 text-[12px] font-bold uppercase tracking-[.4px] text-gray-400">
          What you&apos;ll need
        </div>
        <div className="flex flex-col gap-[11px]">
          {[
            "A valid email address & mobile number",
            "A quick selfie for identity verification",
            "About 5–10 minutes of your time",
          ].map((t) => (
            <div key={t} className="flex items-center gap-[11px] text-[13.5px] text-gray-700">
              <span className="text-brand-pink">●</span>
              {t}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-line bg-white p-[18px] text-left">
        <div className="mb-3 text-[12px] font-bold uppercase tracking-[.4px] text-gray-400">
          Terms, consent &amp; data privacy
        </div>
        <div className="mb-3.5 max-h-[210px] space-y-2.5 overflow-y-auto rounded-xl border border-line2 bg-muted px-3.5 py-3 text-[12.5px] leading-[1.6] text-gray-600">
          <p>
            <b className="text-gray-700">Purpose.</b> Prodigitality is conducting this baseline study to
            understand the needs of food-processing businesses and the organizations that support them.
            Your participation is voluntary, and you may stop at any time before submitting.
          </p>
          <p>
            <b className="text-gray-700">What we collect.</b> Your name, email, mobile number, organization
            details, survey responses, and an identity selfie used solely for verification and quality
            control.
          </p>
          <p>
            <b className="text-gray-700">How we use it.</b> Your information is used to verify your response
            and produce aggregated, de-identified research insights. We do not sell your personal data.
          </p>
          <p>
            <b className="text-gray-700">Data privacy.</b> We process your personal data in accordance with the
            Philippine Data Privacy Act of 2012 (RA&nbsp;10173). You have the right to access, correct, or
            request deletion of your data. To exercise these rights, contact accounts@prodigitality.net.
          </p>
          <p>
            <b className="text-gray-700">Retention.</b> Records are kept only for as long as needed for
            verification and research, after which they are de-identified or securely deleted.
          </p>
        </div>

        <label className="mb-2.5 flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-gray-700">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => actions.setConsentTerms(e.target.checked)}
            className="mt-[2px] h-[17px] w-[17px] flex-none"
            style={{ accentColor: "#E0195F" }}
          />
          <span>
            I have read and agree to the <b>Terms &amp; Conditions</b> of participation in this survey.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-gray-700">
          <input
            type="checkbox"
            checked={agreePrivacy}
            onChange={(e) => actions.setConsentPrivacy(e.target.checked)}
            className="mt-[2px] h-[17px] w-[17px] flex-none"
            style={{ accentColor: "#E0195F" }}
          />
          <span>
            I <b>consent</b>{" "}to the collection and processing of my personal data as described above, in accordance with the Data Privacy Act of 2012 (RA&nbsp;10173).
          </span>
        </label>
      </div>

      <button
        onClick={start}
        disabled={!canStart}
        className="h-12 w-full rounded-[11px] text-[15px] font-bold text-white"
        style={{
          background: canStart ? "#18181B" : "#D4D4D8",
          cursor: canStart ? "pointer" : "not-allowed",
        }}
      >
        Get started
      </button>
      {!canStart && (
        <p className="mt-2.5 text-center text-[12px] text-gray-400">
          Please accept the terms and data privacy consent to continue.
        </p>
      )}
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
  type,
  inputMode,
  error,
  onBlur,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  hint?: string;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  error?: string;
  onBlur?: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        className={cx(
          "h-[42px] w-full rounded-[9px] border px-[13px] text-[13.5px] outline-none",
          error ? "border-red-400" : "border-[#E2E2E6]",
          mono && "font-mono",
        )}
      />
      {error ? (
        <span className="mt-1 block text-[11.5px] text-red-500">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11.5px] text-gray-400">{hint}</span>
      ) : null}
    </label>
  );
}

function Register() {
  const { state, actions } = usePortal();
  const reg = state.reg;
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  // Mobile is stored as "+63" + the local digits the user types (leading 0
  // stripped); the +63 prefix is shown as a fixed addon.
  const mobileLocal = reg.mobile.replace(/^\+63/, "");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email.trim());
  const mobileOk = mobileLocal.replace(/\D/g, "").length === 10;
  const canContinue = emailOk && mobileOk;

  // Create the partial submission row here, then advance to the survey.
  const onContinue = () => {
    void actions.startSubmission();
    actions.flowNext();
  };

  return (
    <div>
      <h1 className="mb-1.5 text-[22px] font-extrabold tracking-[-.5px]">Register your details</h1>
      <p className="mb-[22px] text-[13.5px] text-gray-500">
        Register your details to participate in the Prodigitality baseline survey.
      </p>
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-[22px]">
        <Field
          label={<>Full name <span className="font-medium text-gray-400">(optional)</span></>}
          value={reg.name}
          onChange={(v) => actions.setReg("name", v)}
          placeholder="Juan Dela Cruz"
        />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field
            label="Email address"
            value={reg.email}
            onChange={(v) => actions.setReg("email", v)}
            onBlur={() => touch("email")}
            error={touched.email && !emailOk ? "Enter a valid email address." : ""}
            type="email"
            inputMode="email"
            placeholder="you@email.com"
          />
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Mobile number</span>
            <div
              className={cx(
                "flex h-[42px] w-full overflow-hidden rounded-[9px] border",
                touched.mobile && !mobileOk ? "border-red-400" : "border-[#E2E2E6]",
              )}
            >
              <span className="flex flex-none items-center border-r border-[#E2E2E6] bg-gray-50 px-3 text-[13.5px] font-semibold text-gray-500">
                +63
              </span>
              <input
                value={mobileLocal}
                onChange={(e) =>
                  actions.setReg("mobile", "+63" + e.target.value.replace(/\D/g, "").replace(/^0/, ""))
                }
                onBlur={() => touch("mobile")}
                type="tel"
                inputMode="tel"
                maxLength={10}
                placeholder="9171234567"
                className="h-full flex-1 px-3 text-[13.5px] outline-none"
              />
            </div>
            {touched.mobile && !mobileOk && (
              <span className="mt-1 block text-[11.5px] text-red-500">Enter a valid 10-digit mobile number (e.g. 9171234567).</span>
            )}
          </label>
        </div>
        {state.rType === "TSI" && (
          <div className="border-t border-[#F2F2F4] pt-4">
            <div className="flex items-start gap-2.5 rounded-[9px] border border-brand-pinkLine bg-brand-pinkSoft2 px-3.5 py-3 text-[12.5px] leading-[1.5] text-[#9D174D]">
              <span className="mt-[1px] flex-none">🎁</span>
              <span>
                As a government / TSI organization, you may receive a <b>tumbler giveaway</b>.
                Our team will coordinate delivery details with you after your response is verified.
              </span>
            </div>
          </div>
        )}
      </div>
      <FlowNav nextLabel="Continue" disabled={!canContinue} onNext={onContinue} />
    </div>
  );
}

// Step 4 — the enumerator chooses how the survey gets completed. Only shown in the
// enumerator-driven flow (a self-service respondent resumes straight at Survey).
function ModeChoice() {
  const { state, actions } = usePortal();
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const generated = !!state.accessCode;
  const respondentName = (state.reg.name || "").trim();
  const email = (state.reg.email || "").trim();

  const pickSelf = async () => {
    setBusy(true);
    await actions.chooseMode("self");
    setBusy(false);
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(state.selfServiceLink);
      actions.notify("Link copied");
    } catch {
      actions.notify("Couldn't copy — select and copy the link manually.");
    }
  };
  const send = async () => {
    setSending(true);
    await actions.sendInvite();
    setSending(false);
  };

  if (generated) {
    return (
      <div>
        <h1 className="mb-1.5 text-[22px] font-extrabold tracking-[-.5px]">Self-service link ready</h1>
        <p className="mb-[22px] text-[13.5px] text-gray-500">
          Share this link with{" "}
          <b className="text-gray-700">{respondentName || "the respondent"}</b>. They&apos;ll
          continue the survey on their own device — no need to stay with them.
        </p>

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-[22px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[.4px] text-gray-400">Respondent</div>
              <div className="text-[14px] font-bold text-brand-ink">{respondentName || "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-bold uppercase tracking-[.4px] text-gray-400">Unique code</div>
              <div className="font-mono text-[14px] font-bold text-brand-pink">{state.accessCode}</div>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Survey link</span>
            <div className="flex items-center gap-2 rounded-[9px] border border-line2 bg-muted px-[13px] py-2.5">
              <span className="flex-1 break-all text-left font-mono text-[12.5px] text-gray-700">
                {state.selfServiceLink}
              </span>
              <button
                onClick={copyLink}
                className="flex-none rounded-[7px] bg-brand-pink px-[13px] py-[7px] text-[11.5px] font-bold text-white"
              >
                Copy
              </button>
            </div>
          </div>

          <button
            onClick={send}
            disabled={!email || sending}
            className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[11px] bg-brand-ink text-sm font-bold text-white disabled:opacity-40"
          >
            {sending ? "Sending…" : email ? `Send via email to ${email}` : "Send via email"}
          </button>
          {!email && (
            <p className="-mt-2 text-[11.5px] text-gray-400">
              No email was entered for this respondent — you can still copy and share the link.
            </p>
          )}
        </div>

        <button
          onClick={() => actions.exitFlow()}
          className="mt-5 h-12 w-full rounded-[11px] bg-white text-[15px] font-bold text-gray-700 ring-1 ring-inset ring-[#E2E2E6]"
        >
          Done — start a new respondent
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1.5 text-[22px] font-extrabold tracking-[-.5px]">How will the survey be completed?</h1>
      <p className="mb-[22px] text-[13.5px] text-gray-500">
        Continue the survey together now, or generate a link the respondent can use to
        finish it themselves.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => actions.chooseMode("assisted")}
          disabled={busy}
          className="rounded-2xl border-[1.5px] border-[#E2E2E6] bg-white p-[18px] text-left transition-colors hover:border-brand-pink disabled:opacity-50"
        >
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-brand-ink">
            <span>🧑‍💼</span> Enumerator-assisted
          </div>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-gray-500">
            Continue now and complete the survey together on this device.
          </p>
        </button>

        <button
          onClick={pickSelf}
          disabled={busy}
          className="rounded-2xl border-[1.5px] border-[#E2E2E6] bg-white p-[18px] text-left transition-colors hover:border-brand-pink disabled:opacity-50"
        >
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-brand-ink">
            <span>🔗</span> Self-service
          </div>
          <p className="mt-1.5 text-[13px] leading-[1.5] text-gray-500">
            {busy
              ? "Generating a unique link…"
              : "Generate a unique link (and email it) so the respondent can finish on their own."}
          </p>
        </button>
      </div>

      <button
        onClick={actions.flowBack}
        className="mt-[18px] h-[46px] rounded-[11px] border border-[#E2E2E6] bg-white px-[22px] text-sm font-bold text-gray-700"
      >
        Back
      </button>
    </div>
  );
}

type FaceStatus = "loading" | "none" | "ok" | "multi";

function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("loading");
  const [camError, setCamError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    setCamError("");
    setReady(false);
    setFaceStatus("loading");

    const DENIED_MSG = (
      "Camera access is blocked for this site.\n" +
      "To fix it:\n" +
      "1. Click the lock or camera icon in the address bar\n" +
      "2. Set Camera to “Allow”\n" +
      "3. Tap “Try again” below"
    );

    const start = async () => {
      // Check permission state before calling getUserMedia so we can show
      // actionable instructions when the browser would silently deny the request.
      if (navigator.permissions) {
        try {
          const perm = await navigator.permissions.query({ name: "camera" as PermissionName });
          if (perm.state === "denied" && !cancelled) {
            setCamError(DENIED_MSG);
            return;
          }
        } catch {
          // Permissions API not supported — fall through to getUserMedia
        }
      }

      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        video.onloadedmetadata = () => {
          video.play().then(() => { if (!cancelled) setReady(true); }).catch(() => {});
        };
      } catch (err) {
        if (!cancelled) setCamError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? DENIED_MSG
            : "Camera could not be started. Make sure no other app is using it, then tap Try again.",
        );
        console.warn("Camera:", err);
      }
    };

    start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      if (video) {
        const count = await detectFaceInFrame(video);
        if (!cancelled) {
          setFaceStatus(count === 1 ? "ok" : count > 1 ? "multi" : count === 0 ? "none" : "loading");
        }
      }
      if (!cancelled) setTimeout(tick, 400);
    };
    tick();
    return () => { cancelled = true; };
  }, [ready]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => { if (blob) onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" })); },
      "image/jpeg",
      0.92,
    );
  };

  const borderColor =
    faceStatus === "ok" ? "#22C55E" : faceStatus === "multi" ? "#EF4444" : "rgba(255,255,255,0.45)";
  const statusText =
    faceStatus === "ok" ? "Face detected — tap to capture"
    : faceStatus === "multi" ? "Multiple faces detected — one face only"
    : faceStatus === "none" ? "No face detected — position your face in the oval"
    : "Starting camera…";
  const statusColor =
    faceStatus === "ok" ? "#4ADE80" : faceStatus === "multi" ? "#F87171" : "#6B7280";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center bg-black">
      <div className="flex w-full max-w-[420px] flex-1 flex-col items-center px-4 pt-10">
        <h2 className="mb-1 text-[18px] font-bold text-white">Take your selfie</h2>
        <p className="mb-6 text-[12.5px] text-gray-400">Look straight at the camera</p>

        {camError ? (
          <div className="mx-auto w-full max-w-[320px] rounded-2xl bg-red-950/60 p-6 text-left">
            <p className="mb-3 text-[13px] font-semibold text-red-300">Camera blocked</p>
            <ol className="space-y-1.5 text-[12.5px] leading-snug text-red-200">
              {camError.split("\n").filter(l => /^\d\./.test(l)).map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 font-bold">{i + 1}.</span>
                  <span>{line.replace(/^\d\.\s*/, "")}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-[13px] font-semibold text-white hover:bg-white/20"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="relative w-full overflow-hidden rounded-3xl" style={{ maxWidth: 340, aspectRatio: "3/4" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 300 400"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <mask id="face-oval-mask">
                  <rect width="300" height="400" fill="white" />
                  <ellipse cx="150" cy="182" rx="108" ry="142" fill="black" />
                </mask>
              </defs>
              <rect width="300" height="400" fill="rgba(0,0,0,0.5)" mask="url(#face-oval-mask)" />
              <ellipse cx="150" cy="182" rx="108" ry="142" fill="none" stroke={borderColor} strokeWidth="3" />
            </svg>
          </div>
        )}

        {!camError && (
          <p className="mt-4 text-center text-[12.5px] font-semibold" style={{ color: statusColor }}>
            {statusText}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 pb-12">
        <button
          onClick={capture}
          disabled={faceStatus !== "ok"}
          aria-label="Capture selfie"
          className="flex h-[70px] w-[70px] items-center justify-center rounded-full border-[3px] transition-all disabled:opacity-30"
          style={{ borderColor: faceStatus === "ok" ? "#22C55E" : "#fff" }}
        >
          <div
            className="h-[54px] w-[54px] rounded-full transition-colors"
            style={{ background: faceStatus === "ok" ? "#22C55E" : "#fff" }}
          />
        </button>
        <button onClick={onCancel} className="text-[13px] font-semibold text-gray-400 underline underline-offset-2">
          Cancel
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function Selfie() {
  const { state, actions } = usePortal();
  const done = state.selfie;
  const methodLabel = state.selfieMethod === "upload" ? "Image uploaded" : "Selfie captured";
  const [uploading, setUploading] = useState(false);
  const [busyMsg, setBusyMsg] = useState("Uploading…");
  const [uploadError, setUploadError] = useState("");
  const [uploadFailed, setUploadFailed] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const previewUrlRef = useRef("");
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
  }, []);

  const setPreview = (url: string) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  };

  const handleFile = async (file: File, alreadyVerified = false) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are accepted (JPG, PNG, WEBP, etc.).");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    setUploadError("");
    setUploadFailed(false);
    actions.clearSelfie();
    try {
      if (!alreadyVerified) {
        // Verify the photo actually shows a single face. A count of -1 means the
        // detector couldn't load (CDN down) — fail open so an outage never blocks
        // a respondent from finishing the survey.
        setBusyMsg("Checking photo…");
        const faces = await detectFaceCount(file);
        if (faces === 0) {
          setUploadFailed(true);
          throw new Error("We couldn't detect a face. Make sure your full face is visible and well-lit.");
        }
        if (faces > 1) {
          setUploadFailed(true);
          throw new Error("Multiple faces detected. Make sure only your face is in the photo.");
        }
      }
      // Store the file locally — actual upload to storage happens at submit time
      // so no orphaned files are created if the respondent abandons the survey.
      actions.setSelfieFile(file);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Photo check failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const methodBtn = (active: boolean) =>
    cx(
      "flex h-[46px] items-center justify-center gap-2 rounded-[11px] border-[1.5px] text-[13.5px] font-bold",
      active ? "border-brand-pink bg-brand-pinkSoft text-[#9D174D]" : "border-[#E2E2E6] bg-white text-gray-700",
    );

  const handleCameraCapture = (file: File) => {
    setCameraOpen(false);
    actions.takeSelfie();
    handleFile(file, true); // face was already verified by the camera detection loop
  };

  return (
    <>
      {cameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => setCameraOpen(false)}
        />
      )}
      <div className="pt-2 text-center">
        <h1 className="mb-2 text-[22px] font-extrabold tracking-[-.5px]">Identity selfie</h1>
        <p className="mx-auto mb-6 max-w-[420px] text-[13.5px] text-gray-500">
          A quick selfie confirms a real person completed this survey. Make sure your face is clearly
          visible and well-lit. Used for audit &amp; quality control only.
        </p>
        <div
          className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border-2 border-dashed"
          style={{
            aspectRatio: previewUrl ? "3/4" : undefined,
            height: previewUrl ? undefined : 180,
            borderColor: done ? "#86EFAC" : uploadFailed ? "#FCA5A5" : "#D4D4D8",
            background: previewUrl ? "#000" : done ? "#F0FDF4" : uploadFailed ? "#FEF2F2" : "#FAFAFA",
          }}
        >
          {previewUrl && (
            <img src={previewUrl} alt="Selfie preview" className="absolute inset-0 h-full w-full object-cover" style={{ filter: uploadFailed ? "brightness(0.4)" : undefined }} />
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-[13.5px] font-semibold text-white">{busyMsg}</div>
            </div>
          ) : uploadFailed && previewUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
              <div className="text-[12.5px] font-bold text-white">Not accepted</div>
            </div>
          ) : done && previewUrl ? (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent pb-5 pt-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div className="text-[12.5px] font-bold text-white">{methodLabel}</div>
            </div>
          ) : done ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-3 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-green-100">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div className="text-sm font-bold text-green-700">{methodLabel}</div>
              <div className="mt-[3px] text-[12px] text-gray-400">Identity image attached</div>
            </div>
          ) : !previewUrl ? (
            <div className="flex h-full flex-col items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="11" r="3.4" />
                <path d="M5 20a7 7 0 0 1 14 0" />
                <path d="M9 4h6l1 2h2a2 2 0 0 1 2 2" />
              </svg>
              <div className="mt-3 text-[13.5px] font-semibold text-gray-500">No image yet</div>
            </div>
          ) : null}
        </div>
        {uploadError && <p className="mt-2 text-[12px] text-red-500">{uploadError}</p>}
        <div className="mx-auto mt-4 grid max-w-[360px] grid-cols-2 gap-2.5">
          <button
            onClick={() => setCameraOpen(true)}
            disabled={uploading}
            className={methodBtn(state.selfieMethod === "camera")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Take a selfie
          </button>
          <button
            onClick={() => { actions.uploadSelfie(); uploadRef.current?.click(); }}
            disabled={uploading}
            className={methodBtn(state.selfieMethod === "upload")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M17 8l-5-5-5 5" />
              <path d="M12 3v12" />
            </svg>
            Upload an image
          </button>
        </div>
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
        <div className="mt-4 flex flex-wrap justify-center gap-3.5 text-[11.5px] text-gray-400">
          <span>🔒 Timestamp recorded</span>
          <span>IP &amp; device logged</span>
        </div>
        <div className="mt-6">
          <FlowNav disabled={!done || uploading} />
        </div>
      </div>
    </>
  );
}

const TUMBLER_COLORS: { value: "grey" | "blue" | "black"; label: string; hex: string }[] = [
  { value: "grey", label: "Light Grey", hex: "#D1D5DB" },
  { value: "blue", label: "Navy Blue", hex: "#1E3A5F" },
  { value: "black", label: "Matte Black", hex: "#18181B" },
];

// Step 7 for TSI respondents: a branded tumbler instead of a cash token.
function Shipping() {
  const { state, actions } = usePortal();
  const s = state.shipping;
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  // "Use my details" only works when we actually have registration details on file.
  const hasMyDetails = !!((state.reg.name || "").trim() && (state.reg.mobile || "").trim());
  const useMine = hasMyDetails && s.useMyDetails;
  const effectiveName = useMine ? state.reg.name : s.recipientName;
  const effectivePhone = useMine ? state.reg.mobile : s.recipientPhone;
  const nameOk = effectiveName.trim().length > 0;
  const phoneOk = effectivePhone.trim().length > 0;
  const addressOk = s.address.trim().length > 0;
  const canSubmit = nameOk && phoneOk && addressOk;

  return (
    <div>
      <h1 className="mb-1.5 text-[22px] font-extrabold tracking-[-.5px]">Free token — tumbler</h1>
      <p className="mb-[22px] text-[13.5px] text-gray-500">
        Government / TSI organizations receive a <b className="text-gray-700">branded tumbler</b> instead
        of a cash token. Choose your preferred color and provide the shipping address.
      </p>

      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-[22px]">
        {/* Color picker */}
        <div>
          <span className="mb-2 block text-[12px] font-bold text-gray-700">Tumbler color</span>
          <div className="grid grid-cols-3 gap-2.5">
            {TUMBLER_COLORS.map((c) => {
              const active = s.color === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => actions.setShipping("color", c.value)}
                  className={cx(
                    "flex flex-col items-center gap-2 rounded-[11px] border-[1.5px] py-3 text-[12px] font-bold transition-colors",
                    active ? "border-brand-pink bg-brand-pinkSoft text-[#9D174D]" : "border-[#E2E2E6] bg-white text-zinc-500",
                  )}
                >
                  <div
                    className="h-8 w-8 rounded-full border border-black/10"
                    style={{ background: c.hex }}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Use my own details toggle — only when registration details exist. */}
        {hasMyDetails && (
          <div>
            <span className="mb-2 block text-[12px] font-bold text-gray-700">Recipient</span>
            <div className="flex items-center gap-0.5 rounded-[9px] bg-gray-100 p-[3px]">
              {([["Use my details", true], ["Someone else", false]] as [string, boolean][]).map(([label, val]) => {
                const active = s.useMyDetails === val;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => actions.setShipping("useMyDetails", val)}
                    className="h-[30px] flex-1 rounded-[7px] px-3 text-[12px] font-bold"
                    style={{
                      background: active ? "#fff" : "transparent",
                      color: active ? "#18181B" : "#71717A",
                      boxShadow: active ? "0 1px 2px rgba(0,0,0,.12)" : "none",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!useMine && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field
              label="Recipient name"
              value={s.recipientName}
              onChange={(v) => actions.setShipping("recipientName", v)}
              onBlur={() => touch("recipientName")}
              error={touched.recipientName && !s.recipientName.trim() ? "Required." : ""}
              placeholder="Full name"
            />
            <Field
              label="Recipient phone"
              value={s.recipientPhone}
              onChange={(v) => actions.setShipping("recipientPhone", v)}
              onBlur={() => touch("recipientPhone")}
              error={touched.recipientPhone && !s.recipientPhone.trim() ? "Required." : ""}
              placeholder="09XX XXX XXXX"
              type="tel"
              inputMode="tel"
            />
          </div>
        )}

        {useMine && (
          <div className="rounded-[9px] border border-line2 bg-muted px-3.5 py-2.5 text-[12.5px] text-gray-500">
            <span className="font-semibold text-gray-700">{state.reg.name || "—"}</span>
            {" · "}
            {state.reg.mobile || "—"}
          </div>
        )}

        {/* Shipping address */}
        <div>
          <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Shipping address <span className="text-brand-pink">*</span></span>
          <textarea
            rows={3}
            value={s.address}
            onChange={(e) => actions.setShipping("address", e.target.value)}
            onBlur={() => touch("address")}
            placeholder="Full street address, barangay, city / municipality, province, zip code"
            className={cx(
              "w-full rounded-[9px] border px-3.5 py-2.5 text-[13.5px] leading-[1.55] outline-none resize-none",
              touched.address && !addressOk ? "border-red-400" : "border-[#E2E2E6]",
            )}
          />
          {touched.address && !addressOk && (
            <span className="mt-1 block text-[11.5px] text-red-500">Please enter the shipping address.</span>
          )}
        </div>

        <div className="flex items-center gap-[9px] rounded-[9px] border border-brand-pinkLine bg-brand-pinkSoft2 px-[13px] py-[11px] text-[12px] text-[#9D174D]">
          <span>📦</span>
          Tumblers ship within 7–14 business days after your submission is verified.
        </div>
      </div>

      <FlowNav
        nextLabel="Review & submit"
        disabled={!canSubmit}
        onDisabledClick={() => setTouched({ address: true, recipientName: true, recipientPhone: true })}
      />
    </div>
  );
}

const PAYOUT_METHODS = ["GCash", "Maya", "Bank transfer", "Other"];

// Step 7 for SME / Agri-Tech respondents: a cash token (amount from Settings).
function Payout() {
  const { state, actions } = usePortal();
  const p = state.payout;
  const isBank = p.method === "Bank transfer";
  const isEwallet = p.method === "GCash" || p.method === "Maya";
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const nameOk = p.acctName.trim().length > 0;
  const numDigits = p.acctNum.replace(/\D/g, "");
  const numOk = isEwallet
    ? numDigits.length === 11 && numDigits.startsWith("09")
    : p.acctNum.trim().length > 0;
  const bankOk = p.bank.trim().length > 0;
  // Every method needs an account name + number; bank transfer also needs the bank name.
  const canSubmit = (isBank ? bankOk : true) && nameOk && numOk;
  const numLabel = isEwallet ? "Mobile number" : isBank ? "Account number" : "Account / reference number";
  const numPh = isEwallet ? "09XX XXX XXXX" : "Account or reference no.";
  const numError = touched.acctNum
    ? !p.acctNum.trim()
      ? "Required."
      : isEwallet && !numOk
        ? "Enter a valid PH mobile number (e.g. 09XX XXX XXXX)."
        : ""
    : "";

  return (
    <div>
      <h1 className="mb-1.5 text-[22px] font-extrabold tracking-[-.5px]">Payout details</h1>
      <p className="mb-[22px] text-[13.5px] text-gray-500">
        Where should we send your <b className="text-gray-700">{peso(state.respondentToken)}</b>{" "}
        token once verified?
      </p>
      <div className="flex flex-col gap-[18px] rounded-2xl border border-line bg-white p-[22px]">
        <div>
          <span className="mb-2 block text-[12px] font-bold text-gray-700">Payout method</span>
          <div className="grid grid-cols-2 gap-[9px] sm:grid-cols-4">
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

        {isBank && (
          <Field
            label="Bank name"
            value={p.bank}
            onChange={(v) => actions.setPayout("bank", v)}
            onBlur={() => touch("bank")}
            error={touched.bank && !bankOk ? "Required." : ""}
            placeholder="e.g. BDO, BPI"
          />
        )}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field
            label="Account name"
            value={p.acctName}
            onChange={(v) => actions.setPayout("acctName", v)}
            onBlur={() => touch("acctName")}
            error={touched.acctName && !nameOk ? "Required." : ""}
            placeholder={isEwallet ? "Registered name" : "Account holder"}
          />
          <Field
            label={numLabel}
            value={p.acctNum}
            onChange={(v) =>
              // GCash/Maya numbers are PH mobile numbers — accept digits only, max 11.
              actions.setPayout("acctNum", isEwallet ? v.replace(/\D/g, "").slice(0, 11) : v)
            }
            onBlur={() => touch("acctNum")}
            error={numError}
            type={isEwallet ? "tel" : "text"}
            inputMode={isEwallet ? "tel" : "text"}
            placeholder={numPh}
          />
        </div>

        <div className="flex items-center gap-[9px] rounded-[9px] border border-brand-pinkLine bg-brand-pinkSoft2 px-[13px] py-[11px] text-[12px] text-[#9D174D]">
          <span>🔒</span>
          Payout details are visible only to authorized Prodigitality admins.
        </div>
      </div>
      <FlowNav nextLabel="Review & submit" disabled={!canSubmit} />
    </div>
  );
}

function Review() {
  const { state, actions } = usePortal();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const cls = classify(state.qual);

  const items: [string, string][] = [
    ["Name", state.reg.name || "—"],
    ["Email", state.reg.email || "—"],
    ["Mobile", state.reg.mobile || "—"],
    ["Survey path", typeShort(state.rType)],
    ["Qualification", cls.status],
    ["Survey", state.surveyDone ? "✓ Completed (KoboToolbox)" : "Not completed"],
    [
      "Selfie",
      state.selfie
        ? "✓ " + (state.selfieMethod === "upload" ? "Image uploaded" : "Selfie taken")
        : "Not yet",
    ],
    ["Mode", state.selfService ? "Self-service" : "Enumerator-assisted"],
    state.rType === "TSI"
      ? ["Token", "Tumbler · " + (TUMBLER_COLORS.find((c) => c.value === state.shipping.color)?.label ?? state.shipping.color)]
      : ["Token", peso(state.respondentToken) + " · " + state.payout.method],
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      // Upload the selfie now (deferred from the selfie step so no orphaned
      // files are stored when a respondent abandons mid-survey).
      let selfieUrl: string | null = state.selfieUrl || null;
      if (state.selfieFile) {
        const fd = new FormData();
        fd.append("file", state.selfieFile);
        const sr = await fetch("/api/selfie", { method: "POST", body: fd });
        const sd = await sr.json().catch(() => ({}));
        if (sr.ok && sd.url) selfieUrl = sd.url;
      }

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: state.submissionId || null,
          registration_data: buildRegistrationData(state.reg),
          profiles_data: buildProfileData(state.qual),
          survey_type: state.rType,
          selfie_url: selfieUrl,
          // Respondent token: cash payout for SME/Agri-Tech, tumbler shipping for TSI,
          // stored (with human-readable labels) in a single generic token_data column.
          token_data: state.rType === "TSI" ? buildShippingData(state.shipping) : buildPayoutData(state.payout),
          // External Kobo survey timing captured during the Survey step.
          kobo_start: state.koboStart || null,
          kobo_end: state.koboEnd || null,
          enumerator_slug: state.enumeratorSlug || null,
          consent: {
            terms: state.consentTerms,
            privacy: state.consentPrivacy,
            accepted_at: state.consentAt || null,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }
      await res.json().catch(() => ({}));
      actions.submitFlow();
    } catch {
      setSubmitError("Submission failed. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

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
      {submitError && <p className="mt-3 text-[12px] text-red-500">{submitError}</p>}
      <FlowNav
        nextLabel={submitting ? "Submitting…" : "Submit for verification"}
        onNext={handleSubmit}
        disabled={submitting}
      />
    </div>
  );
}

function Success() {
  const { state } = usePortal();
  const firstName = (state.reg.name || "").trim().split(" ")[0];
  return (
    <div className="pt-[18px] text-center">
      <div className="mx-auto mb-[22px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green-100">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1 className="mb-2.5 text-[26px] font-extrabold tracking-[-.6px]">
        {firstName ? "Thank you, " + firstName + "!" : "Thank you!"}
      </h1>
      <p className="mx-auto mb-6 max-w-[440px] text-[14.5px] leading-[1.6] text-gray-500">
        Your response has been submitted and is now{" "}
        <b className="text-orange-800">pending QA review</b>. You&apos;ll be notified once it has
        been verified.
      </p>

      <p className="mt-3.5 text-[12px] text-gray-400">You can now safely close this window.</p>
    </div>
  );
}
