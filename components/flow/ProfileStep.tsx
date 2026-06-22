"use client";

import { useEffect, useState } from "react";
import { usePortal } from "@/lib/store";
import { RadioOption, MultiOption } from "./Options";
import { cx } from "@/lib/cx";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { Qual } from "@/lib/types";

const ORG_CARDS: { key: Qual["orgType"]; icon: string; title: string; ex: string; help: string }[] = [
  {
    key: "gov",
    icon: "🏛️",
    title: "Government or Business Support Organization",
    ex: "DTI · DOST · Philexport · Chambers of Commerce · Industry Associations",
    help: "Organizations that support, regulate, or promote businesses — such as government agencies (DTI, DOST), export promotion bodies (Philexport), chambers of commerce, and industry associations. Choose this if your role is to assist or oversee businesses rather than produce food yourself.",
  },
  {
    key: "tech",
    icon: "⚙️",
    title: "Technology, Equipment, or Service Provider",
    ex: "Machinery suppliers · Packaging · Testing labs · Food innovation centers",
    help: "Companies that supply machinery, equipment, packaging, laboratory testing, product development, or technical services to food businesses. Choose this if you enable food production but don't make food products yourself.",
  },
  {
    key: "food",
    icon: "🍪",
    title: "Food Processing Business",
    ex: "Food manufacturers · Beverages · Snacks · Bakeries · Packaged foods",
    help: "Businesses that make, process, manufacture, or package food and beverage products — including manufacturers, bakeries, snack and beverage producers, and packaged-food companies. This is the main audience for this baseline survey.",
  },
  {
    key: "other",
    icon: "❓",
    title: "Other",
    ex: "My organization does not fit the categories above.",
    help: "Choose this if your organization doesn't fit any of the categories above. Our team will review your details to determine whether this survey applies to you.",
  },
];
const GOV_ORGS = ["DTI", "DTI-CITEM", "DOST", "Philexport", "Chamber of Commerce", "Industry Association", "Other"];
const TECH_TYPES = [
  "Machinery & Equipment Supplier", "Packaging Company", "Laboratory Testing Services",
  "Food Innovation Center", "Product Development Services", "Agriculture Technology Provider",
  "Technical Consulting Services", "Other",
];
const FOOD_EMP = ["1–9 employees", "10–99 employees", "100–199 employees", "200+ employees"];
const FOOD_ROLE = ["Owner", "Manager", "Department Head", "Technical Staff", "Administrative Staff", "Other"];
const HEAR_ABOUT = ["Friend or Referral", "Social Media", "Other"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-[13px] font-bold text-gray-700">{children}</span>;
}
function Req() {
  return <span className="text-brand-pink"> *</span>;
}
// Dropdown label for a referrer: "Full Name (PS-XXXX)".
function referrerLabel(r: { full_name: string; referral_code: string }) {
  return `${r.full_name} (${r.referral_code})`;
}

function Branch({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3.5 flex flex-col gap-[18px] rounded-2xl border border-line bg-white p-5">
      {children}
    </div>
  );
}

export function ProfileStep() {
  const { state, actions } = usePortal();
  const q = state.qual;
  const techArr = q.techTypes || [];
  const [showOtherReview, setShowOtherReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thanked, setThanked] = useState(false);

  // Referrers for the "Friend or Referral" dropdown, loaded from the referrer
  // table. Selecting one records its code as the submission's referrer_code.
  const [referrerList, setReferrerList] = useState<{ full_name: string; referral_code: string }[]>([]);

  // Load the referrer list (name + code) from the referrer table for the dropdown.
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/referral/referrers");
        const data = await res.json();
        if (active && res.ok) setReferrerList(data.referrers ?? []);
      } catch {
        /* ignore — the dropdown just stays empty */
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  const profileBlocked =
    (q.orgType === "other" && showOtherReview) || (q.orgType === "food" && q.foodMakes === "No");
  const blockTone = q.orgType === "food" && q.foodMakes === "No";
  let ready = false;
  if (q.orgType === "gov") ready = !!q.govOrg && !!q.govDept && !!q.govSupports;
  else if (q.orgType === "tech") ready = techArr.length > 0 && !!q.techSells;
  else if (q.orgType === "food")
    ready = q.foodMakes === "Yes" && !!q.foodProducts && !!q.foodEmployees && !!q.foodRole;
  else if (q.orgType === "other") ready = !!q.orgName.trim();
  ready = ready && !!q.hearAbout && !profileBlocked;
  if (q.orgType === "other") ready = !!q.orgName.trim() && !showOtherReview;
  const showHearAbout = (q.orgType === "gov" || q.orgType === "tech" || q.orgType === "food") && !blockTone;
  const chooseDifferentCategory = () => {
    setShowOtherReview(false);
    actions.setOrg("");
  };

  // When the respondent doesn't qualify ("Other", or a food business that
  // doesn't make/process food), take over the whole step with a dedicated
  // notice page. After they submit, swap to a thank-you screen.
  if (profileBlocked) {
    const isOther = q.orgType === "other";

    if (thanked) {
      return (
        <div className="pt-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mb-2.5 text-[22px] font-extrabold tracking-[-.5px]">Thank you for your interest!</h1>
          <p className="mx-auto mb-8 max-w-[400px] text-[14px] leading-[1.65] text-gray-500">
            {isOther
              ? "Unfortunately, this survey is currently open only to food-processing businesses and the organizations that support them. We've noted your details — our team will reach out if a relevant study becomes available."
              : "Thanks for your time. Our team may follow up if this survey turns out to apply to your business."}
          </p>
          <button
            onClick={actions.exitFlow}
            className="mx-auto h-12 w-full max-w-[320px] rounded-[11px] bg-brand-ink text-[15px] font-bold text-white"
          >
            Return to start
          </button>
        </div>
      );
    }

    return (
      <div className="pt-2 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF7ED]">
          <span className="text-[30px] leading-none">⚠️</span>
        </div>
        <h1 className="mb-2.5 text-[22px] font-extrabold tracking-[-.5px]">
          This survey may not apply to you
        </h1>
        <p className="mx-auto mb-6 max-w-[460px] text-[14px] leading-[1.6] text-gray-500">
          This baseline survey is for businesses that make or process food products. Based on your
          answer it may not apply — but our team can review your details if you believe this is a
          mistake.
        </p>
        <button
          onClick={async () => {
            setSaving(true);
            try {
              await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  org_type: q.orgType,
                  org_name: null,
                  exit_reason: "food_no_processing",
                }),
              });
            } finally {
              setSaving(false);
              setThanked(true);
            }
          }}
          disabled={saving}
          className="mx-auto h-12 w-full max-w-[360px] rounded-[11px] text-[15px] font-bold text-white"
          style={{
            background: saving ? "#D4D4D8" : "#18181B",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Done"}
        </button>
        <div className="mt-3.5">
          <button
            onClick={chooseDifferentCategory}
            className="text-[12.5px] font-semibold text-gray-400 underline"
          >
            Choose a different category
          </button>
        </div>
      </div>
    );
  }

  const yesNo = (field: keyof Qual) => (
    <div className="flex flex-col gap-2">
      {["Yes", "No"].map((o) => (
        <RadioOption key={o} label={o} selected={q[field] === o} onClick={() => actions.setQual(field, o)} />
      ))}
    </div>
  );

  return (
    <div>
      <h1 className="mb-1.5 text-[22px] font-extrabold tracking-[-.5px]">Respondent profile</h1>
      <p className="mb-1.5 text-[13.5px] text-gray-500">
        Help us determine which survey applies to your organization.
      </p>
      <p className="mb-[22px] text-[12.5px] text-gray-400">
        Your answers help us send you the correct survey and ensure the information collected is
        accurate.
      </p>

      <span className="mb-3 block text-[14px] font-bold text-brand-ink">
        What kind of organization do you work for?
      </span>
      <div className="grid grid-cols-2 gap-3">
        {ORG_CARDS.map((c) => (
          <div
            key={c.key}
            onClick={() => {
              setShowOtherReview(false);
              actions.setOrg(c.key);
            }}
            className={cx(
              "relative min-h-[120px] cursor-pointer rounded-2xl border p-4",
              q.orgType === c.key ? "border-brand-pink bg-brand-pinkSoft" : "border-line bg-white",
            )}
          >
            <div className="group absolute right-2.5 top-2.5">
              <button
                type="button"
                aria-label={"More about " + c.title}
                onClick={(e) => e.stopPropagation()}
                className="flex h-[18px] w-[18px] cursor-help items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] font-bold text-gray-400 hover:border-brand-pink hover:text-brand-pink"
              >
                ?
              </button>
              <div className="pointer-events-none absolute right-0 top-[24px] z-20 hidden w-[230px] rounded-xl bg-brand-ink p-3 text-left text-[11.5px] font-medium leading-[1.5] text-white shadow-lg group-hover:block group-focus-within:block">
                {c.help}
              </div>
            </div>
            <div className="mb-2.5 text-[26px] leading-none">{c.icon}</div>
            <div className="mb-1.5 pr-5 text-[13.5px] font-bold leading-[1.3] text-brand-ink">{c.title}</div>
            <div className="text-[11.5px] leading-[1.45] text-gray-400">{c.ex}</div>
          </div>
        ))}
      </div>

      {q.orgType === "other" && (
        <Branch>
          <div>
            <FieldLabel>
              Organization / business name<Req />
            </FieldLabel>
            <input
              value={q.orgName}
              onChange={(e) => actions.setQual("orgName", e.target.value)}
              placeholder="Your organization or business name"
              className="h-[46px] w-full rounded-[9px] border border-[#E2E2E6] px-3 text-[14px] outline-none"
            />
            <p className="mt-2 text-[12px] leading-[1.5] text-gray-400">
              Our team will review whether this survey applies to your organization.
            </p>
          </div>
        </Branch>
      )}

      {q.orgType === "gov" && (
        <Branch>
          <div>
            <FieldLabel>Which organization do you work for?<Req /></FieldLabel>
            <CustomSelect
              value={q.govOrg}
              onChange={(v) => actions.setQual("govOrg", v)}
              options={GOV_ORGS}
            />
          </div>
          <div>
            <FieldLabel>What department, office, or unit are you part of?<Req /></FieldLabel>
            <input
              value={q.govDept}
              onChange={(e) => actions.setQual("govDept", e.target.value)}
              placeholder="e.g. Export Marketing Bureau"
              className="h-[42px] w-full rounded-[9px] border border-[#E2E2E6] px-3 text-[13.5px] outline-none"
            />
          </div>
          <div>
            <FieldLabel>
              Does your organization help businesses grow, improve, export, or access support
              services?<Req />
            </FieldLabel>
            {yesNo("govSupports")}
          </div>
        </Branch>
      )}

      {q.orgType === "tech" && (
        <Branch>
          <div>
            <FieldLabel>
              Which best describes your organization?<Req />{" "}
              <span className="font-medium text-gray-400">(select all that apply)</span>
            </FieldLabel>
            <div className="flex flex-col gap-2">
              {TECH_TYPES.map((o) => (
                <MultiOption
                  key={o}
                  label={o}
                  selected={techArr.includes(o)}
                  onClick={() => actions.toggleTech(o)}
                />
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-[13px] font-bold text-gray-700">
              Do you sell products or services to food manufacturers or food processing businesses?
              <Req />
            </span>
            <div className="mb-2 text-[11.5px] text-gray-400">
              e.g. equipment, packaging, lab testing, product development, technical support
            </div>
            {yesNo("techSells")}
          </div>
        </Branch>
      )}

      {q.orgType === "food" && (
        <Branch>
          <div>
            <span className="mb-1 block text-[13px] font-bold text-gray-700">
              Does your business make, process, manufacture, or package food products?<Req />
            </span>
            <div className="mb-2 text-[11.5px] text-gray-400">
              e.g. snacks, sauces, condiments, beverages, frozen foods, baked goods
            </div>
            {yesNo("foodMakes")}
          </div>
          {q.foodMakes === "Yes" && (
            <>
              <div>
                <FieldLabel>What products does your business produce?<Req /></FieldLabel>
                <input
                  value={q.foodProducts}
                  onChange={(e) => actions.setQual("foodProducts", e.target.value)}
                  placeholder="e.g. dried mangoes, banana chips"
                  className="h-[42px] w-full rounded-[9px] border border-[#E2E2E6] px-3 text-[13.5px] outline-none"
                />
              </div>
              <div>
                <FieldLabel>How many employees does your business have?<Req /></FieldLabel>
                <div className="flex flex-col gap-2">
                  {FOOD_EMP.map((o) => (
                    <RadioOption key={o} label={o} selected={q.foodEmployees === o} onClick={() => actions.setQual("foodEmployees", o)} />
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>What is your role in the organization?<Req /></FieldLabel>
                <div className="flex flex-col gap-2">
                  {FOOD_ROLE.map((o) => (
                    <RadioOption key={o} label={o} selected={q.foodRole === o} onClick={() => actions.setQual("foodRole", o)} />
                  ))}
                </div>
              </div>
            </>
          )}
        </Branch>
      )}

      {showHearAbout && (
        <Branch>
          <div>
            <FieldLabel>How did you hear about this survey?<Req /></FieldLabel>
            <CustomSelect
              value={q.hearAbout}
              onChange={(v) => {
                actions.setQual("hearAbout", v);
                actions.setQual("refName", "");
                if (v !== "Friend or Referral") actions.setReg("code", "");
              }}
              options={HEAR_ABOUT}
            />
          </div>
          {q.hearAbout === "Friend or Referral" && (
            <div>
              <FieldLabel>Referrer</FieldLabel>
              <CustomSelect
                value={q.refName}
                onChange={(v) => {
                  actions.setQual("refName", v);
                  // Selecting a referrer records their code as the referrer_code.
                  const found = referrerList.find((r) => referrerLabel(r) === v);
                  actions.setReg("code", found?.referral_code ?? "");
                }}
                options={referrerList.map(referrerLabel)}
                placeholder="Select a referrer…"
              />
            </div>
          )}
          {q.hearAbout === "Other" && (
            <div>
              <FieldLabel>Please specify</FieldLabel>
              <input
                value={q.refName}
                onChange={(e) => actions.setQual("refName", e.target.value)}
                placeholder="How did you find out?"
                className="h-[42px] w-full rounded-[9px] border border-[#E2E2E6] px-3 text-[13.5px] outline-none"
              />
            </div>
          )}
        </Branch>
      )}

      <div className="mt-[18px] flex gap-2.5">
        <button
          onClick={actions.flowBack}
          className="h-[46px] rounded-[11px] border border-[#E2E2E6] bg-white px-[22px] text-sm font-bold text-gray-700"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (!ready) return;
            if (q.orgType === "other") {
              // Skip the notice screen — go straight to the thank-you state and
              // fire the lead API silently in the background.
              setShowOtherReview(true);
              setThanked(true);
              fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  org_type: q.orgType,
                  org_name: q.orgName.trim() || null,
                  exit_reason: "other_org_type",
                }),
              }).catch(() => {});
              return;
            }
            actions.flowNext();
          }}
          disabled={!ready}
          className="h-[46px] flex-1 rounded-[11px] text-sm font-bold text-white"
          style={{ background: ready ? "#18181B" : "#D4D4D8", cursor: ready ? "pointer" : "not-allowed" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
