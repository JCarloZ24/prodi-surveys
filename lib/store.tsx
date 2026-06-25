"use client";

// Central client-side store for the portal. Mirrors the design prototype's
// `Component` class: one state object plus action methods. A `stateRef` gives
// actions synchronous access to the latest state (the prototype read
// `this.state` directly), so chained updates and toasts stay consistent.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { blankQual } from "./classify";
import { code as codeOf, hash } from "./format";
import { publicUrl, respondentReferralPath } from "./public-url";
import { buildReport } from "./reports";
import { DEFAULT_SURVEY_PAYOUT, DEFAULT_RESPONDENT_TOKEN } from "./selectors";
import type {
  AppMode,
  AuditEntry,
  Enumerator,
  ManualReferrer,
  PayoutDetails,
  Qual,
  Registration,
  Respondent,
  Role,
  ShippingDetails,
  TumblerColor,
  Targets,
  ViewKey,
} from "./types";

type SurveyAnswers = Record<
  string,
  string | string[] | Record<string, string>
>;

export interface PortalState {
  mode: AppMode;
  role: Role;
  // Signed-in user's display name (from their profile). Falls back to the
  // role-default name when not provided (e.g. the standalone flow preview).
  userName: string;
  view: ViewKey;
  loginEmail: string;
  loginPw: string;
  targets: Targets;
  // Flat enumerator payout per verified survey (₱).
  surveyPayout: number;
  // Cash token paid to a respondent on the SME / Agri-Tech paths (₱). TSI gets a tumbler.
  respondentToken: number;
  draftTargets: Targets;
  draftSurveyPayout: number;
  draftRespondentToken: number;
  confirmSave: boolean;
  emailSel: string;
  enumerators: Enumerator[];
  showAddEnum: boolean;
  newEnumName: string;
  newEnumEmail: string;
  manualReferrers: ManualReferrer[];
  showAddRef: boolean;
  newRefName: string;
  newRefKind: string;
  referredBy: string;
  referredCode: string;
  referralPath: string;
  enumeratorSlug: string;
  submissionId: string;
  qual: Qual;
  respondents: Respondent[];
  audit: AuditEntry[];
  selectedId: number | null;
  search: string;
  filterType: string;
  filterStatus: string;
  flaggedOnly: boolean;
  paid: Record<number, string>;
  toast: string | null;
  rStep: number;
  // Furthest step validly reached — the stepper allows jumping to any step up to
  // this (forward or backward), since everything up to here has been filled in.
  rMaxStep: number;
  rType: Respondent["type"];
  reg: Registration;
  otp: string;
  survey: SurveyAnswers;
  // The survey now runs in an embedded KoboToolbox form; this flips true when the
  // embed reports a successful submission, which unlocks the next step.
  surveyDone: boolean;
  selfie: boolean;
  selfieMethod: string;
  selfieUrl: string;
  selfieFile: File | null;
  payoutOn: boolean;
  payout: PayoutDetails;
  shipping: ShippingDetails;
  newCode: string;
  consentTerms: boolean;
  consentPrivacy: boolean;
  consentAt: string;
}

const USER_NAMES: Record<Role, string> = {
  admin: "Augusto Teleg",
  enumerator: "Maria Santos",
  stakeholder: "Arianne",
};

function blankReg(): Registration {
  return {
    name: "",
    email: "",
    mobile: "",
    org: "",
    position: "",
    region: "NCR",
    type: "SME",
    code: "",
  };
}
function blankPayout(): PayoutDetails {
  return { method: "GCash", acctName: "", acctNum: "", bank: "" };
}
function blankShipping(): ShippingDetails {
  return { color: "grey" as TumblerColor, useMyDetails: true, recipientName: "", recipientPhone: "", address: "" };
}

const FLOW_DRAFT_KEY = "prodi-surveys.flowDraft.v1";
const REFERRERS_KEY = "prodi-surveys.referrers.v1";
const FLOW_DRAFT_FIELDS = [
  "mode",
  "rStep",
  "rMaxStep",
  "rType",
  "reg",
  "qual",
  "survey",
  "surveyDone",
  "selfie",
  "selfieMethod",
  "selfieUrl",
  "payoutOn",
  "payout",
  "shipping",
  "newCode",
  "consentTerms",
  "consentPrivacy",
  "consentAt",
  "referredBy",
  "referredCode",
  "referralPath",
  "enumeratorSlug",
  "submissionId",
] as const;

function initialState(): PortalState {
  return {
    mode: "login",
    role: "admin",
    userName: "",
    view: "dashboard",
    loginEmail: "",
    loginPw: "",
    targets: { TSI: 4, AgriTech: 10, SME: 100 },
    surveyPayout: DEFAULT_SURVEY_PAYOUT,
    respondentToken: DEFAULT_RESPONDENT_TOKEN,
    draftTargets: { TSI: 4, AgriTech: 10, SME: 100 },
    draftSurveyPayout: DEFAULT_SURVEY_PAYOUT,
    draftRespondentToken: DEFAULT_RESPONDENT_TOKEN,
    confirmSave: false,
    emailSel: "verify",
    enumerators: [
      { name: "Maria Santos", email: "maria.santos@prodigitality.net" },
      { name: "Jun Mercado", email: "jun.mercado@prodigitality.net" },
      { name: "Liza Domingo", email: "liza.domingo@prodigitality.net" },
      { name: "Paolo Rivera", email: "paolo.rivera@prodigitality.net" },
    ],
    showAddEnum: false,
    newEnumName: "",
    newEnumEmail: "",
    manualReferrers: (() => {
      if (typeof window === "undefined") return [{ name: "DOST", kind: "Partner / TSI" }];
      try {
        const raw = window.localStorage.getItem(REFERRERS_KEY);
        if (raw) return JSON.parse(raw) as ManualReferrer[];
      } catch { /* ignore */ }
      return [{ name: "DOST", kind: "Partner / TSI" }];
    })(),
    showAddRef: false,
    newRefName: "",
    newRefKind: "Partner / TSI",
    referredBy: "",
    referredCode: "",
    referralPath: "",
    enumeratorSlug: "",
    submissionId: "",
    qual: blankQual(),
    respondents: [],
    audit: [],
    selectedId: null,
    search: "",
    filterType: "all",
    filterStatus: "all",
    flaggedOnly: false,
    paid: {},
    toast: null,
    rStep: 0,
    rMaxStep: 0,
    rType: "SME",
    reg: blankReg(),
    otp: "",
    survey: {},
    surveyDone: false,
    selfie: false,
    selfieMethod: "",
    selfieUrl: "",
    selfieFile: null,
    payoutOn: true,
    payout: blankPayout(),
    shipping: blankShipping(),
    newCode: "",
    consentTerms: false,
    consentPrivacy: false,
    consentAt: "",
  };
}

function hydrateDraft(base: PortalState): PortalState {
  if (typeof window === "undefined") return base;

  try {
    const raw = window.localStorage.getItem(FLOW_DRAFT_KEY);
    if (!raw) return base;
    const draft = JSON.parse(raw) as Partial<PortalState>;
    if (draft.mode !== "flow") return base;
    return {
      ...base,
      ...draft,
      reg: { ...blankReg(), ...(draft.reg || {}) },
      qual: { ...blankQual(), ...(draft.qual || {}) },
      survey: draft.survey || {},
      payout: { ...blankPayout(), ...(draft.payout || {}) },
      shipping: { ...blankShipping(), ...(draft.shipping || {}) },
      otp: "",
    };
  } catch {
    return base;
  }
}

function logEntry(action: string, target: string, by: string): AuditEntry {
  return [action, target, by, "just now", "#EDE9FE", "#5B21B6", "user"];
}

export interface PortalActions {
  setLoginEmail(v: string): void;
  setLoginPw(v: string): void;
  login(role?: Role): void;
  logout(): void;
  setView(v: ViewKey): void;
  setRole(r: Role): void;
  setSearch(v: string): void;
  openProfile(id: number): void;
  closeProfile(): void;
  setFilterType(v: string): void;
  setFilterStatus(v: string): void;
  toggleFlagged(): void;
  qaAct(id: number, action: "approve" | "reject" | "follow"): void;
  approvePayout(id: number): void;
  holdPayout(id: number): void;
  markPaid(id: number): void;
  approveTokenPayout(id: number): void;
  holdTokenPayout(id: number): void;
  markTokenPaid(id: number): void;
  doExport(name: string, fmt: string): void;
  setTarget(path: keyof Targets, val: string): void;
  setSurveyPayout(val: string): void;
  setRespondentToken(val: string): void;
  askSaveSettings(): void;
  cancelSaveSettings(): void;
  confirmSaveSettings(): void;
  discardSettings(): void;
  setShowAddEnum(b: boolean): void;
  setNewEnumName(v: string): void;
  setNewEnumEmail(v: string): void;
  addEnumerator(): void;
  renameEnumerator(i: number, v: string): void;
  setEnumEmail(i: number, v: string): void;
  removeEnumerator(i: number): void;
  setShowAddRef(b: boolean): void;
  setNewRefName(v: string): void;
  setNewRefKind(v: string): void;
  addReferrer(): void;
  setEmail(id: string): void;
  launchFlow(): void;
  launchReferralFlow(code: string, preview?: boolean): void;
  launchEnumeratorFlow(slug: string, referralCode?: string): void;
  exitFlow(): void;
  flowNext(): void;
  flowBack(): void;
  goStep(n: number): void;
  verifyOtp(): void;
  startSubmission(): Promise<void>;
  setSubmissionId(id: string): void;
  setReg(k: keyof Registration, v: string): void;
  setOtp(v: string): void;
  setAnswer(id: string, v: string): void;
  toggleMulti(id: string, opt: string): void;
  setMatrix(id: string, row: string, v: string): void;
  setSurveyDone(v: boolean): void;
  takeSelfie(): void;
  uploadSelfie(): void;
  setSelfieUrl(url: string): void;
  setSelfieFile(file: File | null): void;
  clearSelfie(): void;
  setPayoutOn(v: boolean): void;
  setPayout(k: keyof PayoutDetails, v: string): void;
  setShipping(k: keyof ShippingDetails, v: string | boolean): void;
  setOrg(t: Qual["orgType"]): void;
  setQual(f: keyof Qual, v: string): void;
  toggleTech(opt: string): void;
  submitFlow(referralCode?: string): void;
  promoteToReferrer(): void;
  copyReferral(): void;
  previewReferral(): void;
  setConsentTerms(v: boolean): void;
  setConsentPrivacy(v: boolean): void;
  confirmConsent(): void;
  notify(msg: string): void;
}

interface PortalContextValue {
  state: PortalState;
  actions: PortalActions;
}

const PortalContext = createContext<PortalContextValue | null>(null);

// React 18/19 export the hooks under these names; alias for terseness.
const useCb = useCallback as typeof useCallback;

export function PortalProvider({
  children,
  initialRespondents,
  initialRole,
  initialMode,
  initialUserName,
  initialSurveyPayout,
  initialRespondentToken,
  initialTargets,
}: {
  children: React.ReactNode;
  initialRespondents?: Respondent[];
  initialRole?: Role;
  initialMode?: AppMode;
  initialUserName?: string;
  initialSurveyPayout?: number;
  initialRespondentToken?: number;
  initialTargets?: Targets;
}) {
  const [state, setState] = useState<PortalState>(() => {
    const s = initialState();
    if (initialRespondents) s.respondents = initialRespondents;
    if (initialRole) s.role = initialRole;
    if (initialMode) s.mode = initialMode;
    if (initialUserName) s.userName = initialUserName;
    // Seed persisted settings (app_settings) so the live values + Settings drafts
    // reflect the DB, not the hardcoded defaults.
    if (typeof initialSurveyPayout === "number") {
      s.surveyPayout = initialSurveyPayout;
      s.draftSurveyPayout = initialSurveyPayout;
    }
    if (typeof initialRespondentToken === "number") {
      s.respondentToken = initialRespondentToken;
      s.draftRespondentToken = initialRespondentToken;
    }
    if (initialTargets) {
      s.targets = { ...initialTargets };
      s.draftTargets = { ...initialTargets };
    }
    return s;
  });
  // Mirror the latest state into a ref so action handlers (which always run
  // after commit) can read it synchronously, like the prototype's `this.state`.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState((current) => hydrateDraft(current));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.mode !== "flow") {
      window.localStorage.removeItem(FLOW_DRAFT_KEY);
      return;
    }
    const draft = FLOW_DRAFT_FIELDS.reduce(
      (acc, key) => ({
        ...acc,
        [key]: state[key],
      }),
      {} as Partial<PortalState>,
    );
    window.localStorage.setItem(FLOW_DRAFT_KEY, JSON.stringify(draft));
  }, [state]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = useCb(
    (u: Partial<PortalState> | ((s: PortalState) => Partial<PortalState>)) => {
      setState((prev) => ({
        ...prev,
        ...(typeof u === "function" ? u(prev) : u),
      }));
    },
    [],
  );

  const toast = useCb((msg: string) => {
    set({ toast: msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => set({ toast: null }), 2600);
  }, [set]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const settingsDirty = useCb((s: PortalState) => {
    return (
      JSON.stringify(s.draftTargets) !== JSON.stringify(s.targets) ||
      s.draftSurveyPayout !== s.surveyPayout ||
      s.draftRespondentToken !== s.respondentToken
    );
  }, []);

  const actions: PortalActions = useMemo(() => {
    const userName = () => stateRef.current.userName || USER_NAMES[stateRef.current.role];
    const prependLog = (action: string, target: string, by?: string) =>
      [logEntry(action, target, by || userName()), ...stateRef.current.audit];
    const resetFlow = (): Partial<PortalState> => ({
      mode: "flow",
      rStep: 0,
      rMaxStep: 0,
      otp: "",
      survey: {},
      surveyDone: false,
      selfie: false,
      selfieMethod: "",
      selfieUrl: "",
      selfieFile: null,
      payoutOn: true,
      referredBy: "",
      referredCode: "",
      referralPath: "",
      enumeratorSlug: "",
      submissionId: "",
      qual: blankQual(),
      reg: blankReg(),
      payout: blankPayout(),
      shipping: blankShipping(),
      consentTerms: false,
      consentPrivacy: false,
      consentAt: "",
    });

    return {
      setLoginEmail: (v) => set({ loginEmail: v }),
      setLoginPw: (v) => set({ loginPw: v }),
      login: (role) => {
        const r = role || stateRef.current.role || "admin";
        set({ mode: "portal", role: r, view: "dashboard", selectedId: null });
        set({
          audit: [logEntry("Admin login", "· " + USER_NAMES[r], USER_NAMES[r]), ...stateRef.current.audit],
        });
      },
      logout: () => set({ mode: "login", loginPw: "" }),
      setView: (v) => set({ view: v, selectedId: null }),
      setRole: (r) => set({ role: r, view: "dashboard", selectedId: null }),
      setSearch: (v) => set({ search: v }),
      openProfile: (id) => set({ selectedId: id }),
      closeProfile: () => set({ selectedId: null }),
      setFilterType: (v) => set({ filterType: v }),
      setFilterStatus: (v) => set({ filterStatus: v }),
      toggleFlagged: () => set({ flaggedOnly: !stateRef.current.flaggedOnly }),

      qaAct: (id, action) => {
        const s = stateRef.current;
        const map = { approve: "Verified", reject: "Rejected", follow: "Needs Follow-up" } as const;
        const ns = map[action];
        const recs = s.respondents.map((r) => {
          if (r.id !== id) return r;
          const verified = ns === "Verified";
          return {
            ...r,
            status: ns,
            verified,
            // Verifying a survey makes the enumerator's flat ₱400 payable.
            payStatus: verified ? "Pending" : "—",
          };
        });
        const rec = s.respondents.find((r) => r.id === id);
        const verb = { approve: "Verified", reject: "Rejected", follow: "Marked follow-up" }[action];
        const word = action === "approve" ? "approved" : action === "reject" ? "rejected" : "flagged follow-up";
        set({
          respondents: recs,
          selectedId: null,
          audit: [logEntry("QA " + word, "· " + (rec?.name ?? ""), userName()), ...s.audit],
        });
        toast(verb + " · " + (rec?.name ?? ""));

        // Persist to Supabase.
        if (rec?.supabaseId) {
          const dbStatus = { approve: "verified", reject: "rejected", follow: "follow_up" }[action];
          fetch(`/api/portal/submissions/${rec.supabaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: dbStatus }),
          }).catch(() => toast("Saved locally — DB sync failed"));
        }
      },

      approvePayout: (id) => {
        const s = stateRef.current;
        const rec = s.respondents.find((r) => r.id === id);
        set({
          respondents: s.respondents.map((r) => r.id === id ? { ...r, payStatus: "Approved" } : r),
          audit: [logEntry("Payout approved", "· " + (rec?.name ?? ""), userName()), ...s.audit],
        });
        toast("Payout approved · " + (rec?.name ?? ""));
        if (rec?.supabaseId) {
          fetch(`/api/portal/submissions/${rec.supabaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pay_status: "approved" }),
          }).catch(() => toast("Saved locally — DB sync failed"));
        }
      },

      holdPayout: (id) => {
        const s = stateRef.current;
        const rec = s.respondents.find((r) => r.id === id);
        set({
          respondents: s.respondents.map((r) => r.id === id ? { ...r, payStatus: "On Hold" } : r),
          audit: [logEntry("Payout put on hold", "· " + (rec?.name ?? ""), userName()), ...s.audit],
        });
        toast("Payout on hold · " + (rec?.name ?? ""));
        if (rec?.supabaseId) {
          fetch(`/api/portal/submissions/${rec.supabaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pay_status: "on_hold" }),
          }).catch(() => toast("Saved locally — DB sync failed"));
        }
      },

      markPaid: (id) => {
        const s = stateRef.current;
        const dateLabel = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric" });
        const recs = s.respondents.map((r) =>
          r.id === id ? { ...r, payStatus: "Paid", _paidDate: dateLabel } : r,
        );
        const paid = { ...s.paid, [id]: dateLabel };
        const rec = s.respondents.find((r) => r.id === id);
        set({
          respondents: recs,
          paid,
          audit: [logEntry("Payout marked paid", "· " + (rec?.name ?? ""), userName()), ...s.audit],
        });
        toast("Payout marked paid · " + (rec?.name ?? ""));
        if (rec?.supabaseId) {
          fetch(`/api/portal/submissions/${rec.supabaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pay_status: "paid" }),
          }).catch(() => toast("Saved locally — DB sync failed"));
        }
      },

      // Respondent token payout lifecycle (cash for SME/Agri-Tech, tumbler for TSI),
      // independent of the enumerator payout above. PATCHes respondent_pay_status.
      approveTokenPayout: (id) => {
        const s = stateRef.current;
        const rec = s.respondents.find((r) => r.id === id);
        set({
          respondents: s.respondents.map((r) => r.id === id ? { ...r, respondentPayStatus: "Approved" } : r),
          audit: [logEntry("Token payout approved", "· " + (rec?.name ?? ""), userName()), ...s.audit],
        });
        toast("Token payout approved · " + (rec?.name ?? ""));
        if (rec?.supabaseId) {
          fetch(`/api/portal/submissions/${rec.supabaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ respondent_pay_status: "approved" }),
          }).catch(() => toast("Saved locally — DB sync failed"));
        }
      },

      holdTokenPayout: (id) => {
        const s = stateRef.current;
        const rec = s.respondents.find((r) => r.id === id);
        set({
          respondents: s.respondents.map((r) => r.id === id ? { ...r, respondentPayStatus: "On Hold" } : r),
          audit: [logEntry("Token payout put on hold", "· " + (rec?.name ?? ""), userName()), ...s.audit],
        });
        toast("Token payout on hold · " + (rec?.name ?? ""));
        if (rec?.supabaseId) {
          fetch(`/api/portal/submissions/${rec.supabaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ respondent_pay_status: "on_hold" }),
          }).catch(() => toast("Saved locally — DB sync failed"));
        }
      },

      markTokenPaid: (id) => {
        const s = stateRef.current;
        const dateLabel = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric" });
        const rec = s.respondents.find((r) => r.id === id);
        set({
          respondents: s.respondents.map((r) =>
            // Paying the respondent token auto-approves the enumerator payout, so
            // the Enumerator tab immediately offers "Mark paid".
            r.id === id ? { ...r, respondentPayStatus: "Paid", respondentPaidDate: dateLabel, payStatus: "Approved" } : r,
          ),
          audit: [logEntry("Token payout marked paid", "· " + (rec?.name ?? ""), userName()), ...s.audit],
        });
        toast("Token payout marked paid · " + (rec?.name ?? ""));
        if (rec?.supabaseId) {
          fetch(`/api/portal/submissions/${rec.supabaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ respondent_pay_status: "paid" }),
          }).catch(() => toast("Saved locally — DB sync failed"));
        }
      },

      doExport: (name, fmt) => {
        const s = stateRef.current;
        const report = buildReport(name, fmt, {
          respondents: s.respondents,
          audit: s.audit,
          surveyPayout: s.surveyPayout,
          role: s.role,
        });
        if (!report) {
          toast(name + " isn't available for your role");
          return;
        }
        if (typeof window !== "undefined") {
          const blob = new Blob([report.content], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = report.filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
        set({ audit: prependLog("Data exported", "· " + name + " (" + fmt + ")") });
        toast("Exported " + name + " as " + fmt);
      },

      setTarget: (path, val) => {
        const n = Math.max(0, parseInt(val, 10) || 0);
        set((s) => ({ draftTargets: { ...s.draftTargets, [path]: n } }));
      },
      setSurveyPayout: (val) => {
        const n = Math.max(0, parseInt(val, 10) || 0);
        set({ draftSurveyPayout: n });
      },
      setRespondentToken: (val) => {
        const n = Math.max(0, parseInt(val, 10) || 0);
        set({ draftRespondentToken: n });
      },
      askSaveSettings: () => {
        if (settingsDirty(stateRef.current)) set({ confirmSave: true });
      },
      cancelSaveSettings: () => set({ confirmSave: false }),
      confirmSaveSettings: () => {
        const s = stateRef.current;
        const targets = { ...s.draftTargets };
        const surveyPayout = s.draftSurveyPayout;
        const respondentToken = s.draftRespondentToken;
        set({
          targets,
          surveyPayout,
          respondentToken,
          confirmSave: false,
          audit: [logEntry("Settings updated", "· targets, enumerator payout & respondent token", userName()), ...s.audit],
        });
        toast("Settings saved");
        // Persist to the app_settings row (admin only). On failure the change
        // stays applied locally for this session but won't survive a reload.
        fetch("/api/portal/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ surveyPayout, respondentToken, targets }),
        })
          .then((res) => { if (!res.ok) toast("Saved locally — DB sync failed"); })
          .catch(() => toast("Saved locally — DB sync failed"));
      },
      discardSettings: () => {
        const s = stateRef.current;
        set({
          draftTargets: { ...s.targets },
          draftSurveyPayout: s.surveyPayout,
          draftRespondentToken: s.respondentToken,
        });
        toast("Changes discarded");
      },

      setShowAddEnum: (b) =>
        set(b ? { showAddEnum: true } : { showAddEnum: false, newEnumName: "", newEnumEmail: "" }),
      setNewEnumName: (v) => set({ newEnumName: v }),
      setNewEnumEmail: (v) => set({ newEnumEmail: v }),
      addEnumerator: () => {
        const s = stateRef.current;
        const name = (s.newEnumName || "").trim();
        if (!name) return;
        const list = [...s.enumerators, { name, email: (s.newEnumEmail || "").trim() }];
        set({
          enumerators: list,
          newEnumName: "",
          newEnumEmail: "",
          showAddEnum: false,
          audit: [logEntry("Enumerator added", "· " + name, userName()), ...s.audit],
        });
        toast("Enumerator added · " + name);
      },
      renameEnumerator: (i, newName) => {
        const s = stateRef.current;
        const old = s.enumerators[i].name;
        const list = s.enumerators.map((e, j) => (j === i ? { ...e, name: newName } : e));
        const recs = s.respondents.map((r) =>
          r.enumerator === old ? { ...r, enumerator: newName } : r,
        );
        set({ enumerators: list, respondents: recs });
      },
      setEnumEmail: (i, val) => {
        set((s) => ({
          enumerators: s.enumerators.map((e, j) => (j === i ? { ...e, email: val } : e)),
        }));
      },
      removeEnumerator: (i) => {
        const s = stateRef.current;
        const e = s.enumerators[i];
        const recs = s.respondents.map((r) =>
          r.enumerator === e.name ? { ...r, enumerator: "—" } : r,
        );
        const list = s.enumerators.filter((_, j) => j !== i);
        set({ enumerators: list, respondents: recs });
        toast("Enumerator removed · " + e.name);
      },

      setShowAddRef: (b) =>
        set(b ? { showAddRef: true } : { showAddRef: false, newRefName: "" }),
      setNewRefName: (v) => set({ newRefName: v }),
      setNewRefKind: (v) => set({ newRefKind: v }),
      addReferrer: () => {
        const s = stateRef.current;
        const name = (s.newRefName || "").trim();
        if (!name) return;
        const list = [...s.manualReferrers, { name, kind: s.newRefKind }];
        const c = "PS-" + codeOf(hash(name));
        try { window.localStorage.setItem(REFERRERS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
        set({
          manualReferrers: list,
          newRefName: "",
          newRefKind: "Partner / TSI",
          showAddRef: false,
          audit: [logEntry("Referrer added", "· " + name + " (" + c + ")", userName()), ...s.audit],
        });
        toast("Referrer added · " + name + " · " + c);
      },

      setEmail: (id) => set({ emailSel: id }),

      launchFlow: () => set(resetFlow()),
      launchReferralFlow: (referralCode, preview = false) => {
        const c = referralCode.trim().toUpperCase();
        const s = stateRef.current;
        if (s.mode === "flow" && s.reg.code === c) return;
        set({
          ...resetFlow(),
          referredBy: "Referral",
          referredCode: c,
          referralPath: (preview ? "/preview/r/" : "/r/") + encodeURIComponent(c),
          reg: { ...blankReg(), code: c },
        });
      },
      launchEnumeratorFlow: (slug, referralCode) => {
        const refC = (referralCode || "").trim().toUpperCase();
        const s = stateRef.current;
        // Avoid re-init when the flow is already set up for the same enumerator
        // link + referral code.
        if (s.mode === "flow" && s.enumeratorSlug === slug && s.reg.code === refC) return;
        set({
          ...resetFlow(),
          enumeratorSlug: slug,
          ...(refC ? { referredBy: "Referral", referredCode: refC } : {}),
          reg: { ...blankReg(), code: refC },
          // A referral link implies "Friend or Referral" so the prefilled code
          // surfaces (and validates) in the Profile step.
          ...(refC ? { qual: { ...blankQual(), hearAbout: "Friend or Referral" } } : {}),
        });
      },
      exitFlow: () => set(resetFlow()),
      // Linear wizard: Welcome(0) → Profile(1) → Register(2) → Survey(5) →
      // Selfie(6) → Payout or Shipping(7) → Review(8) → Success(9). The OTP(3)
      // and Handoff(4) steps have been removed: Register goes straight to Survey,
      // and every respondent is enumerator-assisted. TSI respondents always see
      // step 7 (Shipping/tumbler); others see Payout only when payoutOn.
      flowNext: () => {
        const s = stateRef.current;
        let n = s.rStep;
        if (n === 6) {
          if (!s.selfie) return;
          // Selfie → Token step (7): Payout for SME/Agri-Tech, Shipping/tumbler for TSI.
          n = 7;
        } else if (n === 7) {
          n = 8;
        } else if (n === 8) {
          n = 9;
        } else if (n === 2) {
          n = 5; // skip the removed OTP(3) and Handoff(4) steps
        } else {
          n = Math.min(9, n + 1);
        }
        set({ rStep: n, rMaxStep: Math.max(s.rMaxStep, n) });
      },
      flowBack: () => {
        const s = stateRef.current;
        let n = s.rStep;
        if (n === 8) n = 7; // Review → Token step
        else if (n === 7) n = 6; // Token step → Selfie
        else if (n === 5) n = 2; // skip the removed OTP(3) and Handoff(4) steps
        else n = Math.max(0, n - 1);
        set({ rStep: n });
      },
      // Jump to any step already reached (t <= rMaxStep) — forward or backward.
      // Steps beyond the furthest reached aren't filled in yet, so they stay locked.
      goStep: (n) => {
        const s = stateRef.current;
        if (n === s.rStep || n > s.rMaxStep) return;
        set({ rStep: n });
      },
      verifyOtp: () => set({ rStep: 5 }),
      // Create the submission row (is_survey_completed=false) when the respondent
      // leaves Register (Register → Survey). Non-fatal: the final submit inserts a
      // row if none exists. Skipped when a row already exists.
      startSubmission: async () => {
        const s = stateRef.current;
        if (s.submissionId) return;
        try {
          const res = await fetch("/api/submit/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              registration: { ...s.reg, type: s.rType },
              qualification: s.qual,
              survey_type: s.rType,
              referrer_code: s.reg.code || null,
              enumerator_slug: s.enumeratorSlug || null,
              // Every respondent is offered a token (cash for SME/Agri-Tech, tumbler for TSI).
              payout_offered: true,
              consent: {
                terms: s.consentTerms,
                privacy: s.consentPrivacy,
                accepted_at: s.consentAt || null,
              },
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.id) set({ submissionId: data.id });
        } catch {
          // Non-fatal: the final submit will insert a row if none exists.
        }
      },
      setSubmissionId: (id) => set({ submissionId: id }),
      setReg: (k, v) => {
        if (k === "type") set((s) => ({ reg: { ...s.reg, type: v as Respondent["type"] }, rType: v as Respondent["type"] }));
        else set((s) => ({ reg: { ...s.reg, [k]: v } }));
      },
      setOtp: (v) => set({ otp: v.replace(/\D/g, "").slice(0, 6) }),
      setAnswer: (id, v) => set((s) => ({ survey: { ...s.survey, [id]: v } })),
      toggleMulti: (id, opt) => {
        set((s) => {
          const cur = s.survey[id];
          const arr = Array.isArray(cur) ? [...cur] : [];
          const i = arr.indexOf(opt);
          if (i >= 0) arr.splice(i, 1);
          else arr.push(opt);
          return { survey: { ...s.survey, [id]: arr } };
        });
      },
      setMatrix: (id, row, v) => {
        set((s) => {
          const prev = s.survey[id];
          const obj =
            prev && typeof prev === "object" && !Array.isArray(prev)
              ? { ...(prev as Record<string, string>) }
              : {};
          obj[row] = v;
          return { survey: { ...s.survey, [id]: obj } };
        });
      },
      setSurveyDone: (v) => set({ surveyDone: v }),
      takeSelfie: () => set({ selfieMethod: "camera" }),
      uploadSelfie: () => set({ selfieMethod: "upload" }),
      setSelfieUrl: (url) => set({ selfieUrl: url, selfie: true }),
      setSelfieFile: (file) => set({ selfieFile: file, selfie: !!file }),
      clearSelfie: () => set({ selfie: false, selfieUrl: "", selfieFile: null }),
      setPayoutOn: (v) => set({ payoutOn: v }),
      setPayout: (k, v) => set((s) => ({ payout: { ...s.payout, [k]: v } })),
      setShipping: (k, v) => set((s) => ({ shipping: { ...s.shipping, [k]: v } })),

      setOrg: (t) => {
        const map: Record<string, Respondent["type"] | ""> = { gov: "TSI", tech: "AgriTech", food: "SME", other: "" };
        set((s) => {
          // Keep reg.type in lockstep with the survey path (rType) so the stored
          // registration never disagrees with survey_type.
          const newType = (map[t] || s.rType) as Respondent["type"];
          // Reset the org/business name when switching categories so it never
          // leaks across selections (the tech/food/other branches each re-capture it).
          return {
            qual: { ...s.qual, orgType: t, orgName: "" },
            rType: newType,
            reg: { ...s.reg, type: newType, org: "" },
          };
        });
      },
      setQual: (f, v) => set((s) => ({ qual: { ...s.qual, [f]: v } })),
      toggleTech: (opt) => {
        set((s) => {
          const arr = [...(s.qual.techTypes || [])];
          const i = arr.indexOf(opt);
          if (i >= 0) arr.splice(i, 1);
          else arr.push(opt);
          return { qual: { ...s.qual, techTypes: arr } };
        });
      },

      submitFlow: (referralCode) => {
        // The submission is already persisted to Supabase by the Review step's
        // /api/submit call. Here we only generate the referral code shown on the
        // success screen and advance the wizard. The API returns the saved code;
        // the client fallback is only for old/offline-like responses.
        const s = stateRef.current;
        const c = referralCode || "PS-" + codeOf(hash((s.reg.email || s.reg.name || "respondent") + Date.now()));
        set({ newCode: c, rStep: 9 });
      },

      notify: (msg) => toast(msg),
      setConsentTerms: (v) => set({ consentTerms: v }),
      setConsentPrivacy: (v) => set({ consentPrivacy: v }),
      // Stamp the moment both consents were accepted (when leaving the Welcome
      // step), so the submission carries an auditable consent timestamp.
      confirmConsent: () => set({ consentAt: new Date().toISOString() }),

      // Record the respondent as a referrer (type=respondent) when they opt in to
      // refer someone. Idempotent server-side (unique referral_code), fire-and-forget.
      promoteToReferrer: () => {
        const s = stateRef.current;
        const code = s.newCode;
        if (!code) return;
        fetch("/api/referral/promote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referral_code: code,
            full_name: s.reg.name,
            email: s.reg.email,
            phone: s.reg.mobile,
          }),
        }).catch(() => {
          /* non-fatal: the success screen still shows the link */
        });
      },
      copyReferral: () => {
        const s = stateRef.current;
        const path = s.enumeratorSlug
          ? respondentReferralPath(s.enumeratorSlug, s.newCode || "")
          : s.referralPath || "/r/" + encodeURIComponent(s.newCode || "");
        const link = publicUrl(path);
        try {
          if (navigator.clipboard) navigator.clipboard.writeText(link);
        } catch {
          /* clipboard unavailable */
        }
        toast("Referral link copied · " + link);
      },
      previewReferral: () => {
        const s = stateRef.current;
        const c = s.newCode;
        if (typeof window !== "undefined") {
          // Enumerator-enrolled respondents preview through the real survey link
          // (nothing is recorded until submit); others use the /r/ preview route.
          window.location.href = s.enumeratorSlug
            ? respondentReferralPath(s.enumeratorSlug, c)
            : "/preview/r/" + encodeURIComponent(c);
          return;
        }
        set({
          mode: "flow",
          rStep: 0,
          rMaxStep: 0,
          referredBy: "Referral",
          referredCode: c,
          referralPath: "/preview/r/" + encodeURIComponent(c),
          rType: "SME",
          otp: "",
          survey: {},
          surveyDone: false,
          selfie: false,
          selfieMethod: "",
          payoutOn: true,
          qual: blankQual(),
          reg: { ...blankReg(), code: c },
          payout: blankPayout(),
          consentTerms: false,
          consentPrivacy: false,
          consentAt: "",
        });
      },
    };
  }, [set, toast, settingsDirty]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}

export { USER_NAMES };
