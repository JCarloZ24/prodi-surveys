"use client";

import { usePortal } from "@/lib/store";
import { emailDefs } from "@/lib/emails";
import { LogoMark } from "@/lib/icons";
import { cx } from "@/lib/cx";
import type { EmailBlock } from "@/lib/types";

const AUDIENCE_COLOR: Record<string, string> = {
  Respondent: "#E0195F",
  Enumerator: "#7C3AED",
  Referrer: "#0891B2",
  Stakeholder: "#1F1147",
};
const TO_MAP: Record<string, string> = {
  respondent: "maria.delacruz@email.com",
  enumerator: "grace.tan@prodigitality.net",
  referrer: "partner@dti.gov.ph",
  stakeholder: "arianne@prodigitality.net",
};
const GROUP_ORDER = ["Respondent", "Enumerator", "Referrer", "Stakeholder"] as const;

function Block({ block, accent }: { block: EmailBlock; accent: string }) {
  switch (block.type) {
    case "h":
      return (
        <div className="mb-3.5 text-[20px] font-extrabold leading-[1.25] tracking-[-.4px] text-brand-ink">
          {block.text}
        </div>
      );
    case "p":
      return <p className="mb-4 text-[14px] leading-[1.6] text-zinc-600">{block.text}</p>;
    case "btn":
      return (
        <div className="mb-[18px]">
          <a
            href="#"
            className="inline-block rounded-[9px] px-[26px] py-[13px] text-[14px] font-bold text-white no-underline"
            style={{ background: accent }}
          >
            {block.text}
          </a>
        </div>
      );
    case "code":
      return (
        <div className="mb-4 rounded-[11px] bg-[#F4F4F6] p-[18px] text-center">
          <span className="font-mono text-[30px] font-bold tracking-[8px] text-brand-ink">
            {block.text}
          </span>
        </div>
      );
    case "linkbox":
      return (
        <div className="mb-4 break-all rounded-[9px] bg-[#F4F4F6] px-3.5 py-3 font-mono text-[12.5px] text-indigo-600">
          {block.text}
        </div>
      );
    case "kv":
      return (
        <div className="mb-4 overflow-hidden rounded-[11px] border border-line2">
          {(block.rows || []).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-[#F2F2F4] px-3.5 py-2.5 last:border-0">
              <span className="text-[13px] text-gray-400">{k}</span>
              <span className="text-[13px] font-bold text-brand-ink">{v}</span>
            </div>
          ))}
        </div>
      );
    case "bullets":
      return (
        <div className="mb-4">
          {(block.items || []).map((it) => (
            <div key={it} className="mb-[7px] flex gap-[9px] text-[14px] leading-[1.55] text-zinc-600">
              <span className="text-brand-pink">•</span>
              <span className="flex-1">{it}</span>
            </div>
          ))}
        </div>
      );
    case "note":
      return <p className="mb-4 text-[12.5px] leading-[1.55] text-gray-400">{block.text}</p>;
    case "divider":
      return <div className="mb-[18px] mt-1.5 h-px bg-[#F0F0F2]" />;
    default:
      return null;
  }
}

export function Emails() {
  const { state, actions } = usePortal();
  const defs = emailDefs();
  const sel = defs.find((e) => e.id === state.emailSel) || defs[0];

  return (
    <div className="max-w-[1180px]">
      <h1 className="mb-1 text-2xl font-extrabold tracking-[-.5px]">Email notifications</h1>
      <p className="mb-5 text-[13.5px] text-gray-500">
        Previews of the transactional emails the system sends to respondents, enumerators, referrers,
        and stakeholders.
      </p>

      <div className="grid grid-cols-[248px_1fr] items-start gap-5">
        {/* List */}
        <div className="sticky top-0 rounded-2xl border border-line bg-white p-2.5">
          {GROUP_ORDER.map((aud) => (
            <div key={aud} className="mb-1.5">
              <div className="flex items-center gap-[7px] px-[11px] pb-1.5 pt-2">
                <span className="h-[7px] w-[7px] flex-none rounded-[2px]" style={{ background: AUDIENCE_COLOR[aud] }} />
                <span className="text-[10.5px] font-bold uppercase tracking-[.5px] text-gray-400">{aud}</span>
              </div>
              {defs
                .filter((e) => e.audience === aud)
                .map((e) => {
                  const active = e.id === state.emailSel;
                  return (
                    <button
                      key={e.id}
                      onClick={() => actions.setEmail(e.id)}
                      className={cx(
                        "flex w-full items-center gap-[9px] rounded-[9px] px-[11px] py-[9px] text-left text-[13px] font-semibold",
                        active ? "bg-brand-pinkSoft text-[#9D174D]" : "text-zinc-500",
                      )}
                    >
                      <span
                        className="h-1.5 w-1.5 flex-none rounded-full"
                        style={{ background: active ? "#E0195F" : "#CBCBD2" }}
                      />
                      <span className="flex-1">{e.name}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="border-b border-line2 px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="rounded-md px-[9px] py-[3px] text-[10.5px] font-bold text-white"
                style={{ background: AUDIENCE_COLOR[sel.audience] }}
              >
                {sel.audience}
              </span>
              <span className="text-[12px] text-gray-400">— sent on this trigger</span>
            </div>
            <div className="mb-2.5 text-[16px] font-extrabold tracking-[-.3px]">{sel.subject}</div>
            <div className="mb-[3px] flex gap-2.5 text-[12px]">
              <span className="w-[42px] flex-none font-semibold text-gray-400">From</span>
              <span className="text-gray-700">{sel.from}</span>
            </div>
            <div className="flex gap-2.5 text-[12px]">
              <span className="w-[42px] flex-none font-semibold text-gray-400">To</span>
              <span className="text-gray-700">{TO_MAP[sel.to] || sel.to}</span>
            </div>
          </div>

          <div className="bg-[#F4F4F6] p-7">
            <div className="mx-auto max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]">
              <div className="h-1.5" style={{ background: sel.accent }} />
              <div className="flex items-center gap-2.5 border-b border-[#F2F2F4] px-8 py-4">
                <LogoMark size={26} gradientId="pgEmail" />
                <span className="text-[14px] font-extrabold tracking-[-.2px]">Prodi-Surveys</span>
              </div>
              <div className="px-8 pb-3 pt-7">
                {sel.blocks.map((b, i) => (
                  <Block key={i} block={b} accent={sel.accent} />
                ))}
              </div>
              <div className="border-t border-[#F2F2F4] bg-muted px-8 py-[18px]">
                <div className="text-[11.5px] leading-[1.55] text-gray-400">
                  Prodigitality · surveys.prodigitality.net
                  <br />
                  You received this email because you registered for or were added to the Prodigitality
                  baseline survey.
                </div>
              </div>
            </div>
            <div className="mx-auto mt-3.5 max-w-[560px] text-center text-[11px] text-[#B0B0B8]">
              {sel.preheader}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
