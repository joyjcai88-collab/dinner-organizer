"use client";

// After the dinner: who actually came, every intro made at the table in one go, and a note.
// Saving updates each guest's dinner count and last seen, so Overdue and seating stay honest.

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Attendance, Guest, Intro, IntroOutcome, OUTCOMES, Table } from "@/lib/types";
import { statusOf } from "@/lib/attendance";
import { Modal, PrimaryButton, GhostButton, RoleBadge, inputCls, labelCls } from "./ui";
import Select from "./Select";

type Row = { key: string; a: string; b: string; outcome: IntroOutcome; detail: string };
const emptyRow = (): Row => ({ key: uuid(), a: "", b: "", outcome: "stayed in touch", detail: "" });

const CHOICES: { value: Attendance; label: string }[] = [
  { value: "attended", label: "Came" },
  { value: "no-show", label: "No-show" },
  { value: "declined", label: "Declined" },
];

interface Props {
  table: Table;
  guests: Guest[]; // the table's guests
  onClose: () => void;
  onSave: (statuses: Record<string, Attendance>, intros: Intro[], note: string | null) => void;
}

export default function RecapModal({ table, guests, onClose, onSave }: Props) {
  // Invited and confirmed guests most likely came; anyone who declined stays declined.
  const [statuses, setStatuses] = useState<Record<string, Attendance>>(() =>
    Object.fromEntries(
      guests.map((g) => {
        const s = statusOf(table, g.id);
        return [g.id, s === "declined" || s === "no-show" ? s : "attended"];
      })
    )
  );
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [note, setNote] = useState(table.note ?? "");

  const came = guests.filter((g) => statuses[g.id] === "attended");
  const setRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const complete = rows.filter((r) => r.a && r.b && r.a !== r.b);

  return (
    <Modal title="How did it go?" subtitle={`${table.name} · ${table.date}`} onClose={onClose} wide>
      <section>
        <p className={labelCls}>Who came · {came.length} of {guests.length}</p>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {guests.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 py-2.5 flex-wrap">
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-serif text-[16px] text-text truncate">{g.name}</span>
                <RoleBadge role={g.role} />
              </span>
              <span className="flex gap-1" role="radiogroup" aria-label={`${g.name} attendance`}>
                {CHOICES.map((c) => {
                  const on = statuses[g.id] === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setStatuses((s) => ({ ...s, [g.id]: c.value }))}
                      className={`rounded-full px-3 py-1.5 font-mono text-[12px] whitespace-nowrap transition-colors ${
                        on ? "bg-ink text-paper" : "bg-pill text-secondary hover:bg-pill-hi"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <p className={labelCls}>Intros made at the table</p>
        {came.length < 2 ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-2">
            Mark at least two guests as came to log intros
          </p>
        ) : (
          <div className="mt-2 space-y-5">
            {rows.map((r) => (
              <div key={r.key} className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_auto] gap-x-4 gap-y-3 items-end">
                <div>
                  <label className={labelCls}>Introduced</label>
                  <Select className={inputCls} value={r.a} onChange={(e) => setRow(r.key, { a: e.target.value })} aria-label="First guest">
                    <option value="">Select…</option>
                    {came.map((g) => (
                      <option key={g.id} value={g.id} disabled={g.id === r.b}>{g.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>To</label>
                  <Select className={inputCls} value={r.b} onChange={(e) => setRow(r.key, { b: e.target.value })} aria-label="Second guest">
                    <option value="">Select…</option>
                    {came.map((g) => (
                      <option key={g.id} value={g.id} disabled={g.id === r.a}>{g.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className={labelCls}>Outcome so far</label>
                  <Select className={inputCls} value={r.outcome} onChange={(e) => setRow(r.key, { outcome: e.target.value as IntroOutcome })} aria-label="Outcome">
                    {OUTCOMES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [emptyRow()]))}
                  className="tap col-span-2 md:col-span-1 justify-self-start md:justify-self-end pb-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-danger transition-colors"
                >
                  Remove
                </button>
                <div className="col-span-2 md:col-span-4">
                  <input
                    className={inputCls}
                    value={r.detail}
                    onChange={(e) => setRow(r.key, { detail: e.target.value })}
                    placeholder="What came of it (optional)"
                    aria-label="Intro detail"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRows((rs) => [...rs, emptyRow()])}
              className="tap font-mono text-[10px] uppercase tracking-[0.08em] text-secondary hover:text-accent transition-colors"
            >
              + Another intro
            </button>
          </div>
        )}
      </section>

      <section className="mt-8">
        <label className={labelCls}>Note</label>
        <textarea
          className={inputCls}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What made the night work, what to change next time"
        />
      </section>

      <div className="flex gap-3 mt-10 flex-wrap">
        <div className="flex-1">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
        <PrimaryButton
          onClick={() => {
            const intros: Intro[] = complete.map((r) => ({
              id: uuid(),
              tableId: table.id,
              a: r.a,
              b: r.b,
              outcome: r.outcome,
              detail: r.detail.trim() || null,
            }));
            onSave(statuses, intros, note.trim() || null);
            onClose();
          }}
        >
          Save recap
        </PrimaryButton>
      </div>
    </Modal>
  );
}
