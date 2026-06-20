"use client";

import { usePortal } from "@/lib/store";
import { RadioOption, MultiOption } from "./Options";
import { cx } from "@/lib/cx";
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
const HEAR_ABOUT = ["DTI", "DOST", "Philexport", "Food Innovation Center", "Enumerator", "Friend or Referral", "Facebook", "Other"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-[13px] font-bold text-gray-700">{children}</span>;
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

  const profileBlocked = q.orgType === "other" || (q.orgType === "food" && q.foodMakes === "No");
  const blockTone = q.orgType === "food" && q.foodMakes === "No";
  let ready = false;
  if (q.orgType === "gov") ready = !!q.govOrg && !!q.govSupports;
  else if (q.orgType === "tech") ready = techArr.length > 0 && !!q.techSells;
  else if (q.orgType === "food") ready = q.foodMakes === "Yes" && !!q.foodRole;
  ready = ready && !!q.hearAbout && !profileBlocked;
  const showHearAbout = (q.orgType === "gov" || q.orgType === "tech" || q.orgType === "food") && !blockTone;

  // When the respondent doesn't qualify ("Other", or a food business that
  // doesn't make/process food), take over the whole step with a dedicated
  // notice page instead of an inline message under the cards.
  if (profileBlocked) {
    const isOther = q.orgType === "other";
    return (
      <div className="pt-2 text-center">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: blockTone ? "#FFF7ED" : "#F5F3FF" }}
        >
          <span className="text-[30px] leading-none">{blockTone ? "⚠️" : "📋"}</span>
        </div>
        <h1 className="mb-2.5 text-[22px] font-extrabold tracking-[-.5px]">
          {isOther ? "Thanks for your interest" : "This survey may not apply to you"}
        </h1>
        <p className="mx-auto mb-7 max-w-[460px] text-[14px] leading-[1.6] text-gray-500">
          {isOther
            ? "Our team will review your information and determine whether this survey applies to your organization. We'll reach out if it does."
            : "This baseline survey is for businesses that make or process food products. Based on your answer it may not apply — but our team can review your details if you believe this is a mistake."}
        </p>
        <button
          onClick={actions.exitFlow}
          className="mx-auto h-12 w-full max-w-[360px] rounded-[11px] bg-brand-ink text-[15px] font-bold text-white"
        >
          Return to start
        </button>
        <div className="mt-3.5">
          <button
            onClick={() => actions.setOrg("")}
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
            onClick={() => actions.setOrg(c.key)}
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

      {q.orgType === "gov" && (
        <Branch>
          <div>
            <FieldLabel>Which organization do you work for?</FieldLabel>
            <select
              value={q.govOrg}
              onChange={(e) => actions.setQual("govOrg", e.target.value)}
              className="h-[42px] w-full rounded-[9px] border border-[#E2E2E6] bg-white px-2.5 text-[13.5px] outline-none"
            >
              <option value="">Select…</option>
              {GOV_ORGS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>What department, office, or unit are you part of?</FieldLabel>
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
              services?
            </FieldLabel>
            {yesNo("govSupports")}
          </div>
        </Branch>
      )}

      {q.orgType === "tech" && (
        <Branch>
          <div>
            <FieldLabel>
              Which best describes your organization?{" "}
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
              Does your business make, process, manufacture, or package food products?
            </span>
            <div className="mb-2 text-[11.5px] text-gray-400">
              e.g. snacks, sauces, condiments, beverages, frozen foods, baked goods
            </div>
            {yesNo("foodMakes")}
          </div>
          {q.foodMakes === "Yes" && (
            <>
              <div>
                <FieldLabel>What products does your business produce?</FieldLabel>
                <input
                  value={q.foodProducts}
                  onChange={(e) => actions.setQual("foodProducts", e.target.value)}
                  placeholder="e.g. dried mangoes, banana chips"
                  className="h-[42px] w-full rounded-[9px] border border-[#E2E2E6] px-3 text-[13.5px] outline-none"
                />
              </div>
              <div>
                <FieldLabel>How many employees does your business have?</FieldLabel>
                <div className="flex flex-col gap-2">
                  {FOOD_EMP.map((o) => (
                    <RadioOption key={o} label={o} selected={q.foodEmployees === o} onClick={() => actions.setQual("foodEmployees", o)} />
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>What is your role in the organization?</FieldLabel>
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
            <FieldLabel>How did you hear about this survey?</FieldLabel>
            <select
              value={q.hearAbout}
              onChange={(e) => actions.setQual("hearAbout", e.target.value)}
              className="h-[42px] w-full rounded-[9px] border border-[#E2E2E6] bg-white px-2.5 text-[13.5px] outline-none"
            >
              <option value="">Select…</option>
              {HEAR_ABOUT.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          {q.hearAbout === "Friend or Referral" && (
            <div>
              <FieldLabel>Referral code or referrer name</FieldLabel>
              <input
                value={q.refName}
                onChange={(e) => actions.setQual("refName", e.target.value)}
                placeholder="Who referred you?"
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
          onClick={() => ready && actions.flowNext()}
          disabled={!ready}
          className="h-[46px] flex-1 rounded-[11px] text-sm font-bold text-white"
          style={{ background: ready ? "#18181B" : "#D4D4D8", cursor: ready ? "pointer" : "not-allowed" }}
        >
          Continue to registration
        </button>
      </div>
    </div>
  );
}
