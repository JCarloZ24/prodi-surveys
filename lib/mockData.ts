// Deterministic mock dataset, ported verbatim from the design prototype's
// `buildData()`. The seeded LCG + identical call order reproduce the same
// records every run. Swap this module for a real API later — nothing else
// depends on how the data is produced.

import { avatarColor, code } from "./format";
import type { AuditEntry, Respondent } from "./types";

interface MakeOpts {
  flags?: string[];
  fast?: boolean;
  referrer?: string;
}

export interface MockData {
  respondents: Respondent[];
  audit: AuditEntry[];
}

export function buildData(): MockData {
  let seed = 987654321;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];

  const regions = [
    "NCR",
    "Region III",
    "Region IV-A",
    "Region VII",
    "Region XI",
    "Region VI",
    "CAR",
    "Region X",
    "Region V",
  ];
  const fnames = [
    "Maria", "Jose", "Ana", "Juan", "Liza", "Paolo", "Grace", "Mark", "Rhea",
    "Carlo", "Divine", "Noel", "Joy", "Ramon", "Cherry", "Ben", "Aileen",
    "Dennis", "Mae", "Ferdie", "Kristine", "Allan", "Bea", "Victor", "Nina",
    "Rico", "Sheila", "Karen", "Edwin", "Lara", "Marco", "Tina", "Gerald",
    "Faith", "Oscar", "Daisy", "Ronnie", "Vina", "Hector", "Joan",
  ];
  const lnames = [
    "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza",
    "Torres", "Flores", "Ramos", "Aquino", "Castro", "Villanueva",
    "del Rosario", "Navarro", "Domingo", "Salazar", "Fernandez", "Aguilar",
    "Pascual", "Lim", "Tan", "Gonzales", "Rivera", "Mercado",
  ];
  const smePre = [
    "Golden", "Sunrise", "Mountain", "Island", "Harvest", "Pure", "Mama",
    "Lola", "Bayanihan", "Sagada", "Davao", "Cebu", "Laguna", "Northern",
    "Tropical", "Heritage", "Greenfield", "Sweet", "Crispy", "Saba",
  ];
  const smeSuf = [
    "Foods", "Food Products", "Delicacies", "Kitchen", "Pastries",
    "Beverages", "Snacks", "Goods", "Trading", "Produce",
  ];
  const agriNames = [
    "AgriHub PH", "FarmLink", "CropConnect", "SakaTech", "HarvestIQ",
    "AniMo Drones", "GreenSprout", "TaniGo", "FieldSense", "AgriPay",
  ];
  const enumNames = ["Maria Santos", "Jun Mercado", "Liza Domingo", "Paolo Rivera"];
  const positions = ["Owner", "Manager", "Director", "Officer", "Proprietor", "VP Ops"];
  const methods = ["GCash", "Maya", "Bank transfer"];

  const recs: Respondent[] = [];
  let id = 1;

  const make = (
    type: Respondent["type"],
    org: string,
    status: string,
    opts: MakeOpts = {},
  ): Respondent => {
    const fn = pick(fnames);
    const ln = pick(lnames);
    const name = fn + " " + ln;
    const emailV = !["New", "Email Verification Pending"].includes(status);
    const surveyDone = [
      "Survey Completed", "Selfie Submitted", "Pending QA",
      "Needs Follow-up", "Verified", "Rejected",
    ].includes(status);
    const selfie = [
      "Selfie Submitted", "Pending QA", "Needs Follow-up", "Verified", "Rejected",
    ].includes(status);
    const verified = status === "Verified";
    const token = type === "SME" ? 200 : 300;
    const referred = rnd() < 0.55;
    const bonus = verified && referred ? (type === "SME" ? 100 : 1000) : 0;
    const mode: Respondent["mode"] =
      rnd() < 0.32 ? "Self-service" : "Enumerator-assisted";
    const enumr = mode === "Self-service" ? "—" : pick(enumNames);
    let payStatus = "—";
    if (verified) {
      const r = rnd();
      payStatus = r < 0.35 ? "Paid" : r < 0.7 ? "Approved" : r < 0.88 ? "Pending" : "On Hold";
    }
    const compMin = opts.fast
      ? Math.floor(rnd() * 3) + 3
      : Math.floor(rnd() * 16) + 8;
    const days = Math.floor(rnd() * 42);
    const ref = referred
      ? opts.referrer ||
        pick(["DTI", "Philexport", "Maria Santos", fn + " " + pick(lnames), "Jun Mercado"])
      : null;
    const method = pick(methods);
    const acct =
      method === "Bank transfer"
        ? "BDO •••• " + (1000 + Math.floor(rnd() * 8999))
        : method + " •••• " + (100 + Math.floor(rnd() * 899));
    const region = pick(regions);
    const position = pick(positions);
    const email =
      (fn + "." + ln).toLowerCase().replace(/[^a-z.]/g, "") + "@email.com";
    const mobile =
      "+63 9" +
      (10 + Math.floor(rnd() * 89)) +
      " " +
      (100 + Math.floor(rnd() * 899)) +
      " " +
      (1000 + Math.floor(rnd() * 8999));
    const recId = id++;
    const recCode = "PS-" + code(id * 7 + 3);
    return {
      id: recId, name, org, type, status, region, position, email, mobile,
      emailV, surveyDone, selfie, verified, token, bonus, referred,
      referrer: ref, mode, enumerator: enumr, payStatus, method, acct, compMin,
      flags: opts.flags || [], code: recCode, createdDays: days,
      color: avatarColor(name),
    };
  };

  // TSI
  (
    [
      ["DTI", "Verified"],
      ["DTI-CITEM", "Verified"],
      ["Philexport", "Pending QA"],
      ["DOST", "Email Verified"],
    ] as [string, string][]
  ).forEach(([o, s]) => recs.push(make("TSI", o, s)));

  // AgriTech
  const agriStatus = [
    "Verified", "Verified", "Verified", "Verified", "Verified",
    "Pending QA", "Pending QA", "Needs Follow-up", "Rejected", "Survey Completed",
  ];
  agriStatus.forEach((s, i) =>
    recs.push(
      make("AgriTech", agriNames[i], s, i === 8 ? { flags: ["Duplicate phone number"] } : {}),
    ),
  );

  // SME
  const smeCounts: Record<string, number> = {
    New: 14,
    "Email Verification Pending": 6,
    "Email Verified": 5,
    "Survey Started": 5,
    "Survey Completed": 4,
    "Selfie Submitted": 3,
    "Pending QA": 9,
    "Needs Follow-up": 6,
    Rejected: 4,
    Verified: 44,
  };
  Object.entries(smeCounts).forEach(([status, n]) => {
    for (let k = 0; k < n; k++) {
      const org = pick(smePre) + " " + pick(smeSuf);
      let opts: MakeOpts = {};
      if (status === "Pending QA" && k === 0)
        opts = { flags: ["Suspiciously fast completion"], fast: true };
      if (status === "Pending QA" && k === 1)
        opts = { flags: ["Same device used for 6 submissions"] };
      if (status === "Rejected" && k === 0)
        opts = { flags: ["Duplicate payout account"] };
      if (status === "Rejected" && k === 1) opts = { flags: ["Duplicate email"] };
      if (status === "Needs Follow-up" && k === 0)
        opts = { flags: ["Missing selfie"] };
      if (status === "Verified" && k % 9 === 0)
        opts = { referrer: "Maria Santos" };
      recs.push(make("SME", org, status, opts));
    }
  });

  return { respondents: recs, audit: seedAudit() };
}

// Fixed audit-log seed (no randomness in the prototype).
function seedAudit(): AuditEntry[] {
  return [
    ["Payout marked paid", "· DTI-CITEM", "M. Reyes (Admin)", "9m ago", "#DCFCE7", "#166534", "payout"],
    ["QA approved", "· Golden Harvest Foods", "A. Cruz (QA)", "24m ago", "#DCFCE7", "#166534", "qa"],
    ["Submission flagged", "· Sunrise Snacks (fast completion)", "System", "38m ago", "#FEE2E2", "#991B1B", "flag"],
    ["Survey completed", "· Mama Lola Delicacies", "Self-service", "1h ago", "#DBEAFE", "#1E40AF", "survey"],
    ["Referral verified", "· FarmLink → 3 SMEs", "System", "2h ago", "#FCE7F3", "#9D174D", "ref"],
    ["Selfie uploaded", "· Island Beverages", "Enumerator (J. Mercado)", "2h ago", "#E0F2FE", "#075985", "selfie"],
    ["QA rejected", "· Tropical Trading (duplicate email)", "A. Cruz (QA)", "3h ago", "#FEE2E2", "#991B1B", "qa"],
    ["Data exported", "· Verified respondents (CSV)", "M. Reyes (Admin)", "4h ago", "#F3F4F6", "#4B5563", "export"],
    ["Email verified", "· Davao Food Products", "Self-service", "5h ago", "#DBEAFE", "#1E40AF", "email"],
    ["Respondent registered", "· Heritage Kitchen", "Enumerator (L. Domingo)", "6h ago", "#F3F4F6", "#4B5563", "user"],
    ["Payout approved", "· Philexport", "M. Reyes (Admin)", "7h ago", "#DCFCE7", "#166534", "payout"],
    ["Referral created", "· DTI → AgriHub PH", "Partner portal", "8h ago", "#FCE7F3", "#9D174D", "ref"],
  ];
}
