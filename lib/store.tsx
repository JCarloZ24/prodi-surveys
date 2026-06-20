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
import { buildData } from "./mockData";
import { code as codeOf, hash } from "./format";
import { publicUrl } from "./public-url";
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
  rType: Respondent["type"];
  reg: Registration;
  otp: string;
  survey: SurveyAnswers;
  selfie: boolean;
  selfieMethod: string;
  selfieUrl: string;
  payoutOn: boolean;
  surveyOnly: boolean;
  handoffMode: string;
  payout: PayoutDetails;
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

const FLOW_DRAFT_KEY = "prodi-surveys.flowDraft.v1";
const FLOW_DRAFT_FIELDS = [
  "mode",
  "rStep",
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
  "newCode",
  "consentTerms",
  "consentPrivacy",
  "consentAt",
  "referredBy",
  "referredCode",
  "referralPath",
] as const;

function initialState(): PortalState {
  const data = buildData();
  const base: PortalState = {
    mode: "login",
    role: "admin",
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
    manualReferrers: [{ name: "DOST", kind: "Partner / TSI" }],
    showAddRef: false,
    newRefName: "",
    newRefKind: "Partner / TSI",
    referredBy: "",
    referredCode: "",
    referralPath: "",
    qual: blankQual(),
    respondents: data.respondents,
    audit: data.audit,
    selectedId: null,
    search: "",
    filterType: "all",
    filterStatus: "all",
    flaggedOnly: false,
    paid: {},
    toast: null,
    rStep: 0,
    rType: "SME",
    reg: blankReg(),
    otp: "",
    survey: {},
    selfie: false,
    selfieMethod: "",
    selfieUrl: "",
    payoutOn: true,
    surveyOnly: false,
    handoffMode: "",
    payout: blankPayout(),
    newCode: "",
    consentTerms: false,
    consentPrivacy: false,
    consentAt: "",
  };
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
  markPaid(id: number): void;
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
  launchSurveyOnlyFlow(code: string, preview?: boolean): void;
  exitFlow(): void;
  flowNext(): void;
  flowBack(): void;
  verifyOtp(): void;
  setReg(k: keyof Registration, v: string): void;
  setOtp(v: string): void;
  setAnswer(id: string, v: string): void;
  toggleMulti(id: string, opt: string): void;
  setMatrix(id: string, row: string, v: string): void;
  takeSelfie(): void;
  uploadSelfie(): void;
  setSelfieUrl(url: string): void;
  setPayoutOn(v: boolean): void;
  handoffAssisted(): void;
  handoffSendLink(): void;
  previewSurveyOnly(code?: string): void;
  handoffDone(): void;
  copySurveyLink(code?: string): void;
  setPayout(k: keyof PayoutDetails, v: string): void;
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

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PortalState>(initialState);
  // Mirror the latest state into a ref so action handlers (which always run
  // after commit) can read it synchronously, like the prototype's `this.state`.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });
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
    const userName = () => USER_NAMES[stateRef.current.role];
    const prependLog = (action: string, target: string, by?: string) =>
      [logEntry(action, target, by || userName()), ...stateRef.current.audit];
    const resetFlow = (): Partial<PortalState> => ({
      mode: "flow",
      rStep: 0,
      otp: "",
      survey: {},
      selfie: false,
      selfieMethod: "",
      selfieUrl: "",
      payoutOn: true,
      surveyOnly: false,
      handoffMode: "",
      referredBy: "",
      referredCode: "",
      referralPath: "",
      qual: blankQual(),
      reg: blankReg(),
      payout: blankPayout(),
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
      },

      markPaid: (id) => {
        const s = stateRef.current;
        const recs = s.respondents.map((r) => (r.id === id ? { ...r, payStatus: "Paid" } : r));
        const paid = {
          ...s.paid,
          [id]: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
        };
        const rec = s.respondents.find((r) => r.id === id);
        set({
          respondents: recs,
          paid,
          audit: [logEntry("Payout marked paid", "· " + (rec?.name ?? ""), userName()), ...s.audit],
        });
        toast("Payout marked paid · " + (rec?.name ?? ""));
      },

      doExport: (name, fmt) => {
        set({ audit: prependLog("Data exported", "· " + name + " (" + fmt + ")") });
        toast("Exporting " + name + " as " + fmt + "…");
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
      launchSurveyOnlyFlow: (surveyCode, preview = false) => {
        const c = surveyCode.trim().toUpperCase();
        const s = stateRef.current;
        if (s.mode === "flow" && s.surveyOnly && s.reg.code === c) return;
        set({
          ...resetFlow(),
          rStep: 5,
          surveyOnly: true,
          handoffMode: preview ? "preview" : "",
          reg: { ...blankReg(), code: c },
        });
      },
      exitFlow: () => set(resetFlow()),
      // Branching wizard: Welcome(0) → Profile(1) → Register(2) → Verify(3) →
      // Handoff(4) → Survey(5) → Selfie(6) → Payout(7) → Review(8) → Success(9).
      // The payout step is skipped when payoutOn is off.
      flowNext: () => {
        const s = stateRef.current;
        let n = s.rStep;
        if (n === 6) {
          if (!s.selfie) return;
          n = s.payoutOn ? 7 : 8;
        } else if (n === 8) {
          n = 9;
        } else {
          n = Math.min(9, n + 1);
        }
        set({ rStep: n });
      },
      flowBack: () => {
        const s = stateRef.current;
        let n = s.rStep;
        if (n === 8) n = s.payoutOn ? 7 : 6;
        else if (n === 5) n = s.surveyOnly ? 5 : 4;
        else n = Math.max(0, n - 1);
        // Survey-only respondents never see steps before the survey.
        if (s.surveyOnly && n < 5) n = 5;
        set({ rStep: n });
      },
      verifyOtp: () => set({ rStep: 4 }),
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
      setPayoutOn: (v) => set({ payoutOn: v }),
      handoffAssisted: () => set({ rStep: 5, surveyOnly: false, handoffMode: "" }),
      handoffSendLink: () => {
        const s = stateRef.current;
        const who = (s.reg.name || "").trim() || "respondent";
        set({
          handoffMode: "link",
          audit: [logEntry("Survey link sent", "· " + who + " (self-service)", userName()), ...s.audit],
        });
      },
      previewSurveyOnly: (code) => {
        const c = (code || "").trim().toUpperCase();
        if (c && typeof window !== "undefined") {
          window.location.href = "/preview/s/" + encodeURIComponent(c);
          return;
        }
        set({ rStep: 5, surveyOnly: true, handoffMode: "" });
      },
      handoffDone: () => {
        set(resetFlow());
        toast("Self-service survey link sent");
      },
      copySurveyLink: (code) => {
        const c = (code || "").trim().toUpperCase() || "PS-" + codeOf(Date.now() % 99999);
        const link = publicUrl("/s/" + encodeURIComponent(c));
        try {
          if (navigator.clipboard) navigator.clipboard.writeText(link);
        } catch {
          /* clipboard unavailable */
        }
        toast("Survey link copied");
      },
      setPayout: (k, v) => set((s) => ({ payout: { ...s.payout, [k]: v } })),

      setOrg: (t) => {
        const map: Record<string, Respondent["type"] | ""> = { gov: "TSI", tech: "AgriTech", food: "SME", other: "" };
        set((s) => ({
          qual: { ...s.qual, orgType: t },
          rType: (map[t] || s.rType) as Respondent["type"],
        }));
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
