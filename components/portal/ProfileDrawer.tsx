"use client";

import { usePortal } from "@/lib/store";
import { tok, bonusOf } from "@/lib/selectors";
import {
  initials,
  peso,
  statusPillClass,
  typePillClass,
  payPillClass,
  typeShort,
} from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/lib/cx";

const SAMPLE_SURVEY: Record<string, [string, string][]> = {
  SME: [
    ["Primary sector", "Processed Food / Agri-food sector"],
    ["Currently exports internationally?", "No, but actively trying to enter"],
    ["Capacity to identify market demands", "Moderate"],
    ["Climate resilience capacity", "Low"],
  ],
  AgriTech: [
    ["Has tools/services for SMEs", "Yes"],
    ["Tools implemented", "Digital diagnostic tools, Training modules"],
    ["Capacity to integrate GESI", "High"],
    ["Support SMEs in climate practices", "Moderate"],
  ],
  TSI: [
    ["Has tools/services for SMEs", "Yes"],
    ["Capacity to deliver export readiness services", "High"],
    ["Support SMEs in climate practices", "Moderate"],
    ["Understanding of GESI mainstreaming", "High"],
  ],
};

function Check({
  label,
  done,
  detail,
}: {
  label: string;
  done: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-[#F0F0F2] py-2 last:border-0">
      <span
        className={cx(
          "flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-extrabold",
          done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400",
        )}
      >
        {done ? "✓" : "✗"}
      </span>
      <span className={cx("flex-1 text-[13px]", done ? "text-gray-700" : "text-gray-400")}>
        {label}
      </span>
      <span className="text-[11.5px] text-gray-400">{detail}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[.5px] text-gray-400">
      {children}
    </div>
  );
}

export function ProfileDrawer() {
  const { state, actions } = usePortal();
  const r = state.respondents.find((x) => x.id === state.selectedId);
  if (!r) return null;

  const isAdmin = state.role === "admin";
  const isStake = state.role === "stakeholder";
  const showFinance = isAdmin;
  const showSelfie = !isStake && r.selfie;
  const showSurvey = r.surveyDone;
  const showQaActions = isAdmin && ["Pending QA", "Needs Follow-up"].includes(r.status as string);
  const bonus = bonusOf(state.incentives, r);
  const sample = SAMPLE_SURVEY[r.type as keyof typeof SAMPLE_SURVEY] || SAMPLE_SURVEY.SME;

  const fields: [string, string][] = [
    ["Email", r.email],
    ["Mobile", r.mobile],
    ["Region", r.region],
    ["Position", r.position],
    ["Mode", r.mode],
    ["Enumerator", r.enumerator],
    ["Referral code", r.code],
    ["Referred by", r.referrer || "—"],
  ];

  return (
    <div
      onClick={actions.closeProfile}
      className="fixed inset-0 z-50 flex justify-end bg-[rgba(15,15,20,.4)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop h-full w-[520px] max-w-[92vw] overflow-y-auto bg-white shadow-[-12px_0_40px_rgba(0,0,0,.18)]"
      >
        <div className="sticky top-0 z-[2] flex items-center gap-[13px] border-b border-line2 bg-white px-[22px] py-[18px]">
          <Avatar initials={initials(r.name).toUpperCase()} bg={r.color} size={44} radius={11} fontSize={15} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[16px] font-extrabold">{r.name}</span>
              <span className={typePillClass(r.type)}>{typeShort(r.type)}</span>
            </div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] text-gray-400">
              {r.org}
            </div>
          </div>
          <button
            onClick={actions.closeProfile}
            className="h-8 w-8 flex-none rounded-lg bg-gray-100 text-[17px] text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="px-[22px] py-5">
          <div className="mb-[18px] flex items-center gap-2.5">
            <span className={statusPillClass(r.status as string)}>{r.status}</span>
            <span className="text-xs text-gray-400">
              Registered {r.createdDays === 0 ? "today" : r.createdDays + "d ago"}
            </span>
          </div>

          <SectionLabel>Verification checklist</SectionLabel>
          <div className="mb-5 rounded-xl border border-line2 bg-muted px-3.5 py-1.5">
            <Check label="Email verified" done={r.emailV} />
            <Check label="Survey completed" done={r.surveyDone} />
            <Check label="Selfie submitted" done={r.selfie} />
            <Check label="Email unique" done detail="no match" />
            <Check
              label="Mobile unique"
              done={!r.flags.includes("Duplicate phone number")}
              detail={r.flags.includes("Duplicate phone number") ? "DUPLICATE" : "no match"}
            />
            <Check
              label="Payout not duplicated"
              done={!r.flags.includes("Duplicate payout account")}
              detail={r.flags.includes("Duplicate payout account") ? "DUPLICATE" : "ok"}
            />
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2.5">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-[10px] border border-line2 bg-muted px-[13px] py-[11px]">
                <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[.3px] text-gray-400">
                  {label}
                </div>
                <div className="break-words text-[13px] font-semibold">{value}</div>
              </div>
            ))}
          </div>

          {showSelfie && (
            <>
              <SectionLabel>Selfie verification</SectionLabel>
              <div className="mb-5 flex gap-[13px] rounded-xl border border-line2 bg-muted p-[13px]">
                <div
                  className="flex h-[74px] w-[74px] flex-none items-center justify-center rounded-[10px]"
                  style={{ background: "linear-gradient(135deg,#E5E7EB,#CBD5E1)" }}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.6">
                    <circle cx="12" cy="9" r="3.5" />
                    <path d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                </div>
                <div className="text-[12px] leading-[1.7] text-gray-500">
                  <div>
                    <b className="text-gray-700">Captured</b>{" "}
                    {r.createdDays === 0 ? "today 14:22" : r.createdDays + "d ago"}
                  </div>
                  <div>IP 124.6.{20 + (r.id % 200)}.{(r.id * 7) % 240}</div>
                  <div>Chrome · Android 13</div>
                </div>
              </div>
            </>
          )}

          {showSurvey && (
            <>
              <SectionLabel>Survey snapshot · {typeShort(r.type)} path</SectionLabel>
              <div className="mb-5 overflow-hidden rounded-xl border border-line2">
                {sample.map(([q, a]) => (
                  <div key={q} className="border-b border-[#F0F0F2] px-3.5 py-[11px] last:border-0">
                    <div className="mb-[3px] text-[12px] text-gray-400">{q}</div>
                    <div className="text-[13px] font-semibold">{a}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {showFinance && (
            <>
              <SectionLabel>
                Payout <span className="text-brand-pink">· Admin only</span>
              </SectionLabel>
              <div className="mb-5 rounded-xl border border-line2 bg-muted p-3.5">
                <FinanceRow k="Respondent token" v={peso(tok(state.incentives, r.type))} />
                <FinanceRow k="Referral bonus" v={bonus ? peso(bonus) : "Not eligible"} />
                <FinanceRow k="Method" v={r.acct} />
                <div className="flex justify-between">
                  <span className="text-[12.5px] text-gray-500">Payout status</span>
                  <span className={payPillClass(r.payStatus)}>{r.payStatus}</span>
                </div>
              </div>
            </>
          )}

          {showQaActions && (
            <div className="sticky bottom-0 flex gap-2.5 bg-white pt-1.5">
              <button
                onClick={() => actions.qaAct(r.id, "approve")}
                className="h-[42px] flex-1 rounded-[10px] bg-green-700 text-[13.5px] font-bold text-white"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => actions.qaAct(r.id, "follow")}
                className="h-[42px] flex-1 rounded-[10px] border border-orange-200 bg-orange-50 text-[13.5px] font-bold text-orange-800"
              >
                Follow-up
              </button>
              <button
                onClick={() => actions.qaAct(r.id, "reject")}
                className="h-[42px] flex-1 rounded-[10px] border border-red-200 bg-red-50 text-[13.5px] font-bold text-red-700"
              >
                ✕ Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FinanceRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="mb-2 flex justify-between">
      <span className="text-[12.5px] text-gray-500">{k}</span>
      <span className="text-[13px] font-bold">{v}</span>
    </div>
  );
}
