"use client";

import { usePortal } from "@/lib/store";
import { enumCards } from "@/lib/selectors";
import { initials } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function Enumerators() {
  const { state, actions } = usePortal();
  const cards = enumCards(state.enumerators, state.respondents, initials);

  return (
    <div className="max-w-[1180px]">
      <div className="mb-[18px] flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-.5px]">Enumerators</h1>
          <p className="mt-1 text-[13.5px] text-gray-500">
            Field team collection performance. Edit names &amp; emails inline, or add new enumerators.
          </p>
        </div>
        <button
          onClick={() => actions.setShowAddEnum(true)}
          className="flex h-[38px] items-center gap-[7px] rounded-[9px] bg-brand-ink px-[15px] text-[13px] font-semibold text-white"
        >
          <span className="text-base leading-none">+</span> Add enumerator
        </button>
      </div>

      {state.showAddEnum && (
        <div className="mb-4 rounded-2xl border border-brand-pink bg-white p-[18px]">
          <div className="mb-3.5 text-[14px] font-bold">New enumerator</div>
          <div className="mb-3.5 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Full name</span>
              <input
                value={state.newEnumName}
                onChange={(e) => actions.setNewEnumName(e.target.value)}
                placeholder="e.g. Grace Tan"
                className="h-10 w-full rounded-[9px] border border-[#E2E2E6] px-3 text-[13.5px] outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Email</span>
              <input
                value={state.newEnumEmail}
                onChange={(e) => actions.setNewEnumEmail(e.target.value)}
                placeholder="name@prodigitality.net"
                className="h-10 w-full rounded-[9px] border border-[#E2E2E6] px-3 text-[13.5px] outline-none"
              />
            </label>
          </div>
          <div className="flex justify-end gap-[9px]">
            <button
              onClick={() => actions.setShowAddEnum(false)}
              className="h-[38px] rounded-[9px] border border-[#E2E2E6] bg-white px-4 text-[13px] font-bold text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={actions.addEnumerator}
              className="h-[38px] rounded-[9px] bg-brand-pink px-[18px] text-[13px] font-bold text-white"
            >
              Add enumerator
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5">
        {cards.map((e, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-[18px]">
            <div className="mb-4 flex items-center gap-3">
              <Avatar initials={e.initials} bg={e.avatarBg} size={42} radius={11} />
              <div className="min-w-0 flex-1">
                <input
                  value={e.name}
                  onChange={(ev) => actions.renameEnumerator(i, ev.target.value)}
                  className="-m-1.5 w-full rounded-[7px] border border-transparent p-1.5 text-[14.5px] font-bold text-brand-ink outline-none hover:border-line focus:border-brand-pink focus:bg-brand-pinkSoft2"
                />
                <input
                  value={e.email}
                  onChange={(ev) => actions.setEnumEmail(i, ev.target.value)}
                  placeholder="add email"
                  className="-mx-1.5 mt-0.5 w-full rounded-md border border-transparent px-1.5 py-0.5 text-[12px] text-gray-400 outline-none hover:border-line2 focus:border-brand-pink focus:bg-brand-pinkSoft2 focus:text-gray-500"
                />
              </div>
              <button
                onClick={() => actions.removeEnumerator(i)}
                title="Remove"
                className="h-[30px] w-[30px] flex-none rounded-lg border border-[#F3D0D0] bg-white text-sm text-red-700 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
            <div className="mb-3.5 text-[12px] text-gray-400">{e.assigned} assigned respondents</div>
            <div className="mb-3.5 grid grid-cols-3 gap-2.5">
              <Stat value={String(e.completed)} label="Completed" />
              <Stat value={String(e.followups)} label="Follow-ups" color="#9A3412" />
              <Stat value={e.rate + "%"} label="Completion" color="#15803D" />
            </div>
            <ProgressBar pct={e.rate} color="#E0195F" height={8} trackClass="bg-[#F1F1F3]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="rounded-[10px] bg-muted px-3 py-[11px]">
      <div className="text-[19px] font-extrabold tracking-[-.5px]" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="text-[11px] font-semibold text-gray-500">{label}</div>
    </div>
  );
}
