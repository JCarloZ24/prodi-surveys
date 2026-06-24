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
import { publicUrl } from "./public-url";
import { buildReport } from "./reports";
import type {
  AppMode,
  AuditEntry,
  Enumerator,
  Incentives,
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
  incentives: Incentives;
  draftTargets: Targets;
  draftIncentives: Incentives;
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
  selfie: boolean;
  selfieMethod: string;
  selfieUrl: string;
  selfieFile: File | null;
  payoutOn: boolean;
  surveyOnly: boolean;
  handoffMode: string;
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
// Transient hand-off so a self-service preview tab can show the respondent's
// prefilled identity (the real /s/ link carries it via the sid submission row).
const PREVIEW_SELF_SERVICE_KEY = "prodi-surveys.previewSelfService";
const REFERRERS_KEY = "prodi-surveys.referrers.v1";
const FLOW_DRAFT_FIELDS = [
  "mode",
  "rStep",
  "rMaxStep",
  "rType",
  "reg",
  "qual",
  "survey",
  "selfie",
  "selfieMethod",
  "selfieUrl",
  "payoutOn",
  "surveyOnly",
  "handoffMode",
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
    incentives: {
      TSI: { token: 300, bonus: 1000 },
      AgriTech: { token: 300, bonus: 1000 },
      SME: { token: 200, bonus: 100 },
    },
    draftTargets: { TSI: 4, AgriTech: 10, SME: 100 },
    draftIncentives: {
      TSI: { token: 300, bonus: 1000 },
      AgriTech: { token: 300, bonus: 1000 },
      SME: { token: 200, bonus: 100 },
    },
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
    selfie: false,
    selfieMethod: "",
    selfieUrl: "",
    selfieFile: null,
    payoutOn: true,
    surveyOnly: false,
    handoffMode: "",
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
    // A self-service launch (base.submissionId set) must only resume a draft from
    // the same survey-only submission. Otherwise a different respondent's draft — or
    // the enumerator's pre-handoff (assisted) draft — lingering in this browser would
    // bleed into the session and be submitted onto the wrong submission row.
    if (base.submissionId && (!draft.surveyOnly || draft.submissionId !== base.submissionId)) {
      return base;
    }
    return {
      ...base,
      ...draft,
      reg: { ...blankReg(), ...(draft.reg || {}) },
      qual: { ...blankQual(), ...(draft.qual || {}) },
      survey: draft.survey || {},
      payout: { ...blankPayout(), ...(draft.payout || {}) },
      shipping: { ...blankShipping(), ...(draft.shipping || {}) },
      otp: "",
      // In survey-only flows rType is sourced from the URL param, not the draft.
      // Keep whatever launchSurveyOnlyFlow already set on base.
      ...(base.surveyOnly ? { rType: base.rType } : {}),
    };
  } catch {
    return base;
  }
}

function logEntry(action: string, target: string, by: string): AuditEntry {
  return [action, target, by, "just now", "#EDE9FE", "#5B21B6", "user"];
}

// Data carried into a self-service survey flow. When the link includes the
// enumerator's partial submission id, the page loads that row and prefills the
// respondent's identity/qualification/consent so the final submit UPDATES the
// same row (rather than creating a second, identity-less one).
export interface SelfServiceLaunch {
  referralCode?: string;
  rType?: string;
  reg?: Partial<Registration>;
  qual?: Partial<Qual>;
  consent?: { terms?: boolean; privacy?: boolean; accepted_at?: string | null } | null;
  payoutOn?: boolean;
  submissionId?: string;
  preview?: boolean;
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
  approveReferrerPayout(id: number): void;
  holdReferrerPayout(id: number): void;
  markReferrerPaid(id: number): void;
  doExport(name: string, fmt: string): void;
  setTarget(path: keyof Targets, val: string): void;
  setIncentive(path: keyof Incentives, field: "token" | "bonus", val: string): void;
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
  launchSurveyOnlyFlow(code: string, preview?: boolean, rType?: string): void;
  launchEnumeratorFlow(slug: string, referralCode?: string, preview?: boolean): void;
  launchEnumeratorSelfServiceFlow(slug: string, opts?: SelfServiceLaunch): void;
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
  takeSelfie(): void;
  uploadSelfie(): void;
  setSelfieUrl(url: string): void;
  setSelfieFile(file: File | null): void;
  clearSelfie(): void;
  setPayoutOn(v: boolean): void;
  handoffAssisted(): void;
  handoffSendLink(): void;
  previewSurveyOnly(code?: string, rType?: string): void;
  handoffDone(): void;
  copySurveyLink(link: string): void;
  handoffReset(): void;
  setPayout(k: keyof PayoutDetails, v: string): void;
  setShipping(k: keyof ShippingDetails, v: string | boolean): void;
  setOrg(t: Qual["orgType"]): void;
  setQual(f: keyof Qual, v: string): void;
  toggleTech(opt: string): void;
  submitFlow(referralCode?: string): void;
  copyReferral(): void;
  previewReferral(): void;
  setConsentTerms(v: boolean): void;
  setConsentPrivacy(v: boolean): void;
  confirmConsent(): void;
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
}: {
  children: React.ReactNode;
  initialRespondents?: Respondent[];
  initialRole?: Role;
  initialMode?: AppMode;
  initialUserName?: string;
}) {
  const [state, setState] = useState<PortalState>(() => {
    const s = initialState();
    if (initialRespondents) s.respondents = initialRespondents;
    if (initialRole) s.role = initialRole;
    if (initialMode) s.mode = initialMode;
    if (initialUserName) s.userName = initialUserName;
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
      JSON.stringify(s.draftIncentives) !== JSON.stringify(s.incentives)
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
      selfie: false,
      selfieMethod: "",
      selfieUrl: "",
      selfieFile: null,
      payoutOn: true,
      surveyOnly: false,
      handoffMode: "",
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
            payStatus: verified ? "Pending" : "—",
            bonus: verified && r.referred ? (r.type === "SME" ? 100 : 1000) : 0,
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

      approveReferrerPayout: (id) => {
        const s = stateRef.current;
        const rec = s.respondents.find((r) => r.id === id);
        set({
          respondents: s.respondents.map((r) => r.id === id ? { ...r, referrerPayStatus: "Approved" } : r),
          audit: [logEntry("Referrer payout approved", "· " + (rec?.referredBy ?? rec?.name ?? ""), userName()), ...s.audit],
        });
        toast("Referrer payout approved · " + (rec?.referredBy ?? rec?.name ?? ""));
        if (rec?.supabaseId) {
          fetch(`/api/portal/submissions/${rec.supabaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referrer_pay_status: "approved" }),
          }).catch(() => toast("Saved locally — DB sync failed"));
        }
      },

      holdReferrerPayout: (id) => {
        const s = stateRef.current;
        const rec = s.respondents.find((r) => r.id === id);
        set({
          respondents: s.respondents.map((r) => r.id === id ? { ...r, referrerPayStatus: "On Hold" } : r),
          audit: [logEntry("Referrer payout put on hold", "· " + (rec?.referredBy ?? rec?.name ?? ""), userName()), ...s.audit],
        });
        toast("Referrer payout on hold · " + (rec?.referredBy ?? rec?.name ?? ""));
        if (rec?.supabaseId) {
          fetch(`/api/portal/submissions/${rec.supabaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referrer_pay_status: "on_hold" }),
          }).catch(() => toast("Saved locally — DB sync failed"));
        }
      },

      markReferrerPaid: (id) => {
        const s = stateRef.current;
        const rec = s.respondents.find((r) => r.id === id);
        set({
          respondents: s.respondents.map((r) => r.id === id ? { ...r, referrerPayStatus: "Paid" } : r),
          audit: [logEntry("Referrer payout marked paid", "· " + (rec?.referredBy ?? rec?.name ?? ""), userName()), ...s.audit],
        });
        toast("Referrer payout marked paid · " + (rec?.referredBy ?? rec?.name ?? ""));
        if (rec?.supabaseId) {
          fetch(`/api/portal/submissions/${rec.supabaseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referrer_pay_status: "paid" }),
          }).catch(() => toast("Saved locally — DB sync failed"));
        }
      },

      doExport: (name, fmt) => {
        const s = stateRef.current;
        const report = buildReport(name, fmt, {
          respondents: s.respondents,
          audit: s.audit,
          incentives: s.incentives,
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
      setIncentive: (path, field, val) => {
        const n = Math.max(0, parseInt(val, 10) || 0);
        set((s) => ({
          draftIncentives: {
            ...s.draftIncentives,
            [path]: { ...s.draftIncentives[path], [field]: n },
          },
        }));
      },
      askSaveSettings: () => {
        if (settingsDirty(stateRef.current)) set({ confirmSave: true });
      },
      cancelSaveSettings: () => set({ confirmSave: false }),
      confirmSaveSettings: () => {
        const s = stateRef.current;
        set({
          targets: { ...s.draftTargets },
          incentives: JSON.parse(JSON.stringify(s.draftIncentives)),
          confirmSave: false,
          audit: [logEntry("Settings updated", "· targets & incentive structure", userName()), ...s.audit],
        });
        toast("Settings saved");
      },
      discardSettings: () => {
        const s = stateRef.current;
        set({
          draftTargets: { ...s.targets },
          draftIncentives: JSON.parse(JSON.stringify(s.incentives)),
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
          r.enumerator === e.name
            ? { ...r, enumerator: "—", mode: "Self-service" as const }
            : r,
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
      launchEnumeratorFlow: (slug, referralCode, preview = false) => {
        const refC = (referralCode || "").trim().toUpperCase();
        const s = stateRef.current;
        // Avoid re-init when the flow is already set up for the same enumerator
        // link + referral code.
        if (s.mode === "flow" && s.enumeratorSlug === slug && s.reg.code === refC) return;
        set({
          ...resetFlow(),
          enumeratorSlug: slug,
          handoffMode: preview ? "preview" : "",
          ...(refC ? { referredBy: "Referral", referredCode: refC } : {}),
          reg: { ...blankReg(), code: refC },
          // A referral link implies "Friend or Referral" so the prefilled code
          // surfaces (and validates) in the Profile step.
          ...(refC ? { qual: { ...blankQual(), hearAbout: "Friend or Referral" } } : {}),
        });
      },
      // Enumerator-attributed self-service link (/s/<slug>?...&self-service=true):
      // the respondent skips Profile/Register/Verify and starts at the survey. When
      // the link carries the enumerator's partial submission (sid), reg/qual/consent
      // are prefilled from it and submissionId is set so the final submit UPDATES
      // that same row (one identified row per respondent). Without a row, rType comes
      // from the URL (?t=) and a fresh row is created on submit.
      launchEnumeratorSelfServiceFlow: (slug, opts = {}) => {
        const { referralCode, rType, reg, qual, consent, payoutOn, submissionId, preview = false } = opts;
        const refC =
          (referralCode || "").trim().toUpperCase() || (reg?.code || "").trim().toUpperCase();
        const sid = submissionId || "";
        const s = stateRef.current;
        if (s.mode === "flow" && s.surveyOnly && s.enumeratorSlug === slug && s.submissionId === sid && s.reg.code === refC) return;
        set({
          ...resetFlow(),
          rStep: 5,
          rMaxStep: 5,
          surveyOnly: true,
          enumeratorSlug: slug,
          submissionId: sid,
          handoffMode: preview ? "preview" : "",
          ...(refC ? { referredBy: "Referral", referredCode: refC } : {}),
          reg: { ...blankReg(), ...(reg || {}), code: refC },
          qual: { ...blankQual(), ...(qual || {}) },
          ...(rType ? { rType: rType as Respondent["type"] } : {}),
          ...(typeof payoutOn === "boolean" ? { payoutOn } : {}),
          ...(consent
            ? {
                consentTerms: !!consent.terms,
                consentPrivacy: !!consent.privacy,
                consentAt: consent.accepted_at || "",
              }
            : {}),
        });
      },
      launchSurveyOnlyFlow: (surveyCode, preview = false, rType?) => {
        const c = surveyCode.trim().toUpperCase();
        const s = stateRef.current;
        // Only skip re-init if the flow is already set up for the same code AND
        // the same rType — a different ?t= param must re-launch to apply the new type.
        if (s.mode === "flow" && s.surveyOnly && s.reg.code === c && (!rType || s.rType === (rType as Respondent["type"]))) return;
        // In preview, pick up the respondent identity stashed by previewSurveyOnly so
        // the preview shows the same prefilled name/email/mobile a real link carries.
        let stash: { reg?: Partial<Registration>; qual?: Partial<Qual>; rType?: string; payoutOn?: boolean } = {};
        if (preview && typeof window !== "undefined") {
          try {
            const raw = window.localStorage.getItem(PREVIEW_SELF_SERVICE_KEY);
            if (raw) stash = JSON.parse(raw);
          } catch {
            /* ignore malformed/absent stash */
          }
        }
        set({
          ...resetFlow(),
          rStep: 5,
          rMaxStep: 5,
          surveyOnly: true,
          handoffMode: preview ? "preview" : "",
          reg: { ...blankReg(), ...(stash.reg || {}), code: c },
          ...(stash.qual ? { qual: { ...blankQual(), ...stash.qual } } : {}),
          ...((rType || stash.rType) ? { rType: (rType || stash.rType) as Respondent["type"] } : {}),
          ...(typeof stash.payoutOn === "boolean" ? { payoutOn: stash.payoutOn } : {}),
        });
      },
      exitFlow: () => set(resetFlow()),
      // Branching wizard: Welcome(0) → Profile(1) → Register(2) → Handoff(4) →
      // Survey(5) → Selfie(6) → Payout or Shipping(7) → Review(8) → Success(9).
      // The OTP/email-verify step (3) has been removed: Register goes straight to
      // Handoff. TSI respondents always see step 7 (Shipping/tumbler); others see
      // Payout only when payoutOn.
      flowNext: () => {
        const s = stateRef.current;
        let n = s.rStep;
        if (n === 6) {
          if (!s.selfie) return;
          const isTSI = s.rType === "TSI";
          // TSI has no Free Token/shipping step (7) anymore — go straight to Review.
          n = !isTSI && s.payoutOn ? 7 : 8;
        } else if (n === 8) {
          n = 9;
        } else if (n === 2) {
          n = 4; // skip the removed OTP step
        } else {
          n = Math.min(9, n + 1);
        }
        set({ rStep: n, rMaxStep: Math.max(s.rMaxStep, n) });
      },
      flowBack: () => {
        const s = stateRef.current;
        let n = s.rStep;
        const isTSI = s.rType === "TSI";
        if (n === 8) n = !isTSI && s.payoutOn ? 7 : 6;
        else if (n === 5) n = s.surveyOnly ? 5 : 4;
        else if (n === 4) n = 2; // skip the removed OTP step
        else n = Math.max(0, n - 1);
        // Survey-only respondents never see steps before the survey.
        if (s.surveyOnly && n < 5) n = 5;
        set({ rStep: n });
      },
      // Jump to any step already reached (t <= rMaxStep) — forward or backward.
      // Steps beyond the furthest reached aren't filled in yet, so they stay locked.
      goStep: (n) => {
        const s = stateRef.current;
        let target = n;
        if (s.surveyOnly && target < 5) target = 5;
        if (target === s.rStep || target > s.rMaxStep) return;
        set({ rStep: target });
      },
      verifyOtp: () => set({ rStep: 4 }),
      // Create the submission row (is_survey_completed=false) when the respondent
      // leaves Register. Previously fired after OTP verify; the OTP step is removed
      // so this runs on Register → Handoff. Non-fatal: the final submit inserts a
      // row if none exists. Skipped in preview and when a row already exists.
      startSubmission: async () => {
        const s = stateRef.current;
        if (s.submissionId || s.handoffMode === "preview") return;
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
              payout_offered: s.payoutOn,
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
      takeSelfie: () => set({ selfieMethod: "camera" }),
      uploadSelfie: () => set({ selfieMethod: "upload" }),
      setSelfieUrl: (url) => set({ selfieUrl: url, selfie: true }),
      setSelfieFile: (file) => set({ selfieFile: file, selfie: !!file }),
      clearSelfie: () => set({ selfie: false, selfieUrl: "", selfieFile: null }),
      setPayoutOn: (v) => set({ payoutOn: v }),
      handoffAssisted: () => {
        const s = stateRef.current;
        set({ rStep: 5, rMaxStep: Math.max(s.rMaxStep, 5), surveyOnly: false, handoffMode: "" });
      },
      handoffSendLink: () => {
        const s = stateRef.current;
        const who = (s.reg.name || "").trim() || "respondent";
        set({
          handoffMode: "link",
          audit: [logEntry("Survey link sent", "· " + who + " (self-service)", userName()), ...s.audit],
        });
      },
      previewSurveyOnly: (code, rType?) => {
        const c = (code || "").trim().toUpperCase();
        const tParam = rType ? "?t=" + encodeURIComponent(rType) : "";
        if (c && typeof window !== "undefined") {
          // Stash the respondent's identity so the preview tab shows it prefilled,
          // mirroring a real self-service link (which carries it via the sid row).
          try {
            const s = stateRef.current;
            window.localStorage.setItem(
              PREVIEW_SELF_SERVICE_KEY,
              JSON.stringify({ reg: s.reg, qual: s.qual, rType: rType || s.rType, payoutOn: s.payoutOn }),
            );
          } catch {
            /* localStorage unavailable — preview just shows blanks */
          }
          window.open("/preview/s/" + encodeURIComponent(c) + tParam, "_blank");
          return;
        }
        set({ rStep: 5, rMaxStep: 5, surveyOnly: true, handoffMode: "" });
      },
      handoffDone: () => {
        set(resetFlow());
        toast("Self-service survey link sent");
      },
      copySurveyLink: (link) => {
        try {
          if (navigator.clipboard) navigator.clipboard.writeText(link);
        } catch {
          /* clipboard unavailable */
        }
        toast("Survey link copied");
      },
      handoffReset: () => set({ handoffMode: "" }),
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

      setConsentTerms: (v) => set({ consentTerms: v }),
      setConsentPrivacy: (v) => set({ consentPrivacy: v }),
      // Stamp the moment both consents were accepted (when leaving the Welcome
      // step), so the submission carries an auditable consent timestamp.
      confirmConsent: () => set({ consentAt: new Date().toISOString() }),

      copyReferral: () => {
        const path =
          stateRef.current.referralPath || "/r/" + encodeURIComponent(stateRef.current.newCode || "");
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
          window.location.href = "/preview/r/" + encodeURIComponent(c);
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
          selfie: false,
          selfieMethod: "",
          payoutOn: true,
          surveyOnly: false,
          handoffMode: "",
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
