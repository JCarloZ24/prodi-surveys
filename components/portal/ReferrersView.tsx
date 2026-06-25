"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";
import { avatarColor, initials } from "@/lib/format";
import { PAYOUT_METHODS, payoutError, payoutNumberLabel } from "@/lib/payout";
import { REFERRER_TYPES, type ReferrerType } from "@/lib/referrer";
import { Modal } from "@/components/portal/Modal";
import { publicUrl, respondentReferralPath } from "@/lib/public-url";
import { usePortal } from "@/lib/store";
import type { PayoutDetails } from "@/lib/types";

type ReferrerRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  type: ReferrerType;
  payout_details: PayoutDetails | null;
  referral_code: string;
  created_at: string;
  enumerator_slug: string | null;
  total_referrals: number;
  verified_referrals: number;
  conversion_rate: number;
};

// Full shareable link for a referrer: respondent referrers route through the
// enumerator that enrolled them; others fall back to the universal /r/<code>.
const referralLink = (r: ReferrerRow) =>
  publicUrl(respondentReferralPath(r.enumerator_slug || "", r.referral_code));

const TABS: { key: ReferrerType; label: string }[] = [
  { key: "enumerator", label: "Enumerators" },
  { key: "respondent", label: "Respondents" },
  { key: "others", label: "Others" },
];

const blankPayout = (): PayoutDetails => ({ method: "GCash", acctName: "", acctNum: "", bank: "" });

export function ReferrersView() {
  const { actions } = usePortal();
  const [rows, setRows] = useState<ReferrerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<ReferrerType>("enumerator");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReferrerRow | null>(null);
  const [deleting, setDeleting] = useState<ReferrerRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portal/referrers");
      const data = await res.json();
      setRows(res.ok ? (data.referrers ?? []) : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/portal/referrers");
        const data = await res.json();
        if (active) setRows(res.ok ? (data.referrers ?? []) : []);
      } catch {
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: ReferrerRow) => {
    setEditing(r);
    setFormOpen(true);
  };

  const onSaved = (msg: string) => {
    setFormOpen(false);
    setNotice(msg);
    load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    try {
      const res = await fetch(`/api/portal/referrers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        setNotice("Referrer deleted.");
      } else {
        const data = await res.json().catch(() => ({}));
        setNotice(data.error ?? "Delete failed.");
      }
    } catch {
      setNotice("Network error.");
    } finally {
      setDeleting(null);
    }
  };

  const visibleRows = rows.filter((r) => r.type === tab);

  const copyCode = (codeValue: string) => {
    try {
      navigator.clipboard?.writeText(codeValue);
      actions.notify(`Copied ${codeValue}`);
    } catch {
      /* clipboard unavailable */
    }
  };

  const copyLink = (link: string) => {
    try {
      navigator.clipboard?.writeText(link);
      actions.notify("Referral link copied");
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#18181B]">Referrers</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Manage referrers and their codes. A referrer&apos;s code can be used as a survey referral code.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-[9px] bg-[#18181B] px-3.5 py-2.5 text-[12.5px] font-bold text-white"
        >
          + Add referrer
        </button>
      </div>

      {notice && (
        <div className="rounded-[9px] border border-[#E4E4E7] bg-[#F7F7F8] px-3.5 py-2.5 text-[12.5px] font-semibold text-gray-600">
          {notice}
        </div>
      )}

      <div className="flex gap-1.5">
        {TABS.map((t) => {
          const count = rows.filter((r) => r.type === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                "rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
                tab === t.key ? "bg-[#18181B] text-white" : "border border-[#E4E4E7] bg-white text-gray-600 hover:border-gray-300",
              )}
            >
              {t.label} <span className={cx("ml-1", tab === t.key ? "text-white/70" : "text-gray-400")}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
        {loading ? (
          <div className="py-14 text-center text-[13.5px] text-gray-400">Loading…</div>
        ) : visibleRows.length === 0 ? (
          <div className="py-14 text-center text-[13.5px] text-gray-400">No {tab} referrers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-[#F2F2F4]">
                  {["REFERRER", "PHONE", "CODE", "REFERRAL LINK", "TOTAL", "VERIFIED", "CONV", "ACTIONS"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => (
                  <tr key={r.id} className="border-b border-[#F5F5F7] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold text-white" style={{ background: avatarColor(r.full_name) }}>
                          {initials(r.full_name)}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#18181B]">{r.full_name}</div>
                          <div className="text-[11.5px] text-gray-400">{r.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-600">{r.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyCode(r.referral_code)}
                        title="Copy code"
                        className="font-mono text-[12px] font-semibold text-gray-700 hover:text-[#18181B]"
                      >
                        {r.referral_code}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex w-[420px] max-w-[420px] items-center gap-1.5">
                        <code className="flex-1 break-all rounded-[7px] bg-[#F4F4F5] px-2 py-1 font-mono text-[11.5px] leading-[1.45] text-gray-600">
                          {referralLink(r)}
                        </code>
                        <button
                          onClick={() => copyLink(referralLink(r))}
                          title="Copy referral link"
                          className="flex-none rounded-[7px] border border-[#E4E4E7] px-2 py-1 text-[11.5px] font-semibold text-gray-600 hover:bg-[#F7F7F8]"
                        >
                          Copy
                        </button>
                        <a
                          href={referralLink(r)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open referral link"
                          className="flex-none rounded-[7px] border border-[#E4E4E7] px-2 py-1 text-[11.5px] font-semibold text-gray-600 hover:bg-[#F7F7F8]"
                        >
                          Open
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-gray-700">{r.total_referrals}</td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-emerald-700">{r.verified_referrals}</td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-600">{Math.round(r.conversion_rate * 100)}%</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEdit(r)}
                          className="rounded-[8px] border border-[#E4E4E7] px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-[#F7F7F8]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting(r)}
                          className="rounded-[8px] border border-red-300 bg-red-50 px-3 py-1.5 text-[12px] font-bold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReferrerFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete referrer">
        <p className="text-[13.5px] leading-[1.6] text-gray-600">
          Delete <strong>{deleting?.full_name}</strong> and their code{" "}
          <span className="font-mono">{deleting?.referral_code}</span>? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setDeleting(null)}
            className="rounded-[9px] border border-[#E4E4E7] px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-[#F7F7F8]"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="rounded-[9px] bg-red-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

const inputClass =
  "h-[42px] w-full rounded-[9px] border border-[#E2E2E6] px-3 text-[13.5px] outline-none focus:border-[#18181B]";

function ReferrerFormModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: ReferrerRow | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<ReferrerType | "">("");
  const [payout, setPayout] = useState<PayoutDetails>(blankPayout());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset/prefill whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    const prefill = () => {
      setStep(0);
      setError("");
      setFullName(editing?.full_name ?? "");
      setEmail(editing?.email ?? "");
      setPhone(editing?.phone ?? "");
      setType(editing?.type ?? "");
      setPayout({ ...blankPayout(), ...(editing?.payout_details ?? {}) });
    };
    prefill();
  }, [open, editing]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const detailsValid = !!fullName.trim() && emailOk && !!phone.trim() && !!type;
  const payoutValid = payoutError(payout) === null;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/portal/referrers/${editing.id}` : "/api/portal/referrers";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, phone, type, payout_details: payout }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      onSaved(editing ? "Referrer updated." : `Referrer created · ${data.referrer?.referral_code ?? ""}`);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    setError("");
    if (step === 0) {
      if (!detailsValid) return;
      setStep(1);
      return;
    }
    if (!payoutValid) {
      setError(payoutError(payout) ?? "");
      return;
    }
    save();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit referrer" : "Add referrer"}>
      {/* Stepper */}
      <div className="mb-5 flex items-center gap-1.5">
        {["Details", "Payment"].map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-1.5">
            <div
              className={cx(
                "flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-extrabold",
                i < step ? "bg-emerald-500 text-white" : i === step ? "bg-[#18181B] text-white" : "bg-gray-100 text-gray-400",
              )}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={cx("text-[11.5px] font-semibold", i === step ? "text-[#18181B]" : "text-gray-400")}>{label}</span>
            {i < 1 && <div className="h-px flex-1 bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan dela Cruz" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Email address</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="09XX XXX XXXX" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Type</label>
            <div className="flex flex-wrap gap-2">
              {REFERRER_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cx(
                    "rounded-[9px] border px-3.5 py-2 text-[12.5px] font-semibold capitalize transition-colors",
                    type === t ? "border-[#18181B] bg-[#18181B] text-white" : "border-[#E4E4E7] bg-white text-gray-600 hover:border-gray-300",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Payment method</label>
            <div className="flex flex-wrap gap-2">
              {PAYOUT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayout((p) => ({ ...p, method: m }))}
                  className={cx(
                    "rounded-[9px] border px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
                    payout.method === m ? "border-[#18181B] bg-[#18181B] text-white" : "border-[#E4E4E7] bg-white text-gray-600 hover:border-gray-300",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Account name</label>
            <input value={payout.acctName} onChange={(e) => setPayout((p) => ({ ...p, acctName: e.target.value }))} placeholder="Name on the account" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">{payoutNumberLabel(payout.method)}</label>
            <input value={payout.acctNum} onChange={(e) => setPayout((p) => ({ ...p, acctNum: e.target.value }))} placeholder={payout.method === "Bank transfer" ? "Account number" : "09XX XXX XXXX"} className={inputClass} />
          </div>
          {payout.method === "Bank transfer" && (
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-gray-600">Bank name</label>
              <input value={payout.bank} onChange={(e) => setPayout((p) => ({ ...p, bank: e.target.value }))} placeholder="e.g. BDO" className={inputClass} />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        {step > 0 && (
          <button
            onClick={() => { setError(""); setStep(0); }}
            disabled={saving}
            className="rounded-[9px] border border-[#E4E4E7] px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-[#F7F7F8] disabled:opacity-40"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={saving || (step === 0 ? !detailsValid : !payoutValid)}
          className="rounded-[9px] bg-[#18181B] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : step === 0 ? "Continue" : editing ? "Save changes" : "Create referrer"}
        </button>
      </div>
    </Modal>
  );
}
