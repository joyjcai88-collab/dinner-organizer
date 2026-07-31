"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Guest, Intro, IntroOutcome, Table, OUTCOMES } from "@/lib/types";
import { Modal, PrimaryButton, GhostButton, inputCls, labelCls } from "./ui";

interface Props {
  editing: Intro | null;
  guests: Guest[];
  tables: Table[];
  presetTableId?: string;
  onClose: () => void;
  onSave: (intro: Intro) => void;
}

export default function IntroModal({
  editing,
  guests,
  tables,
  presetTableId,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<Intro>(
    editing ?? {
      id: uuid(),
      tableId: presetTableId ?? tables[0]?.id ?? "",
      a: "",
      b: "",
      outcome: "stayed in touch",
      detail: null,
    }
  );

  const set = <K extends keyof Intro>(key: K, value: Intro[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const table = tables.find((t) => t.id === form.tableId);
  // intros happen between people who were actually at the table
  const atTable = guests.filter((g) => table?.guestIds.includes(g.id));

  return (
    <Modal
      title={editing ? "Edit intro" : "Log an intro"}
      subtitle="Track what your table produced"
      onClose={onClose}
    >
      <div className="space-y-5">
        <div>
          <label className={labelCls}>At which table</label>
          <select
            className={inputCls}
            value={form.tableId}
            onChange={(e) => {
              set("tableId", e.target.value);
              set("a", "");
              set("b", "");
            }}
          >
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.date}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label className={labelCls}>Introduced</label>
            <select
              className={inputCls}
              value={form.a}
              onChange={(e) => set("a", e.target.value)}
            >
              <option value="">Select…</option>
              {atTable.map((g) => (
                <option key={g.id} value={g.id} disabled={g.id === form.b}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>To</label>
            <select
              className={inputCls}
              value={form.b}
              onChange={(e) => set("b", e.target.value)}
            >
              <option value="">Select…</option>
              {atTable.map((g) => (
                <option key={g.id} value={g.id} disabled={g.id === form.a}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Outcome so far</label>
          <select
            className={inputCls}
            value={form.outcome}
            onChange={(e) => set("outcome", e.target.value as IntroOutcome)}
          >
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Detail</label>
          <input
            className={inputCls}
            value={form.detail ?? ""}
            onChange={(e) => set("detail", e.target.value || null)}
            placeholder="Kestrel led Vantis seed, Aug 2026."
          />
        </div>
      </div>

      <div className="flex gap-3 mt-10">
        <div className="flex-1">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
        <PrimaryButton
          disabled={!form.tableId || !form.a || !form.b}
          onClick={() => {
            onSave(form);
            onClose();
          }}
        >
          {editing ? "Save" : "Log intro"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
