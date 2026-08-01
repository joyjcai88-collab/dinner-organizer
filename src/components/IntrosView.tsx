"use client";

import { useMemo, useState } from "react";
import { Guest, Intro, IntroOutcome, Table, OUTCOMES } from "@/lib/types";
import { upsertIntro, deleteIntro } from "@/lib/store";
import IntroModal from "./IntroModal";
import { OutcomeBadge, PrimaryButton, inputCls } from "./ui";

interface Props {
  guests: Guest[];
  tables: Table[];
  intros: Intro[];
  onRefresh: () => void;
}

export default function IntrosView({ guests, tables, intros, onRefresh }: Props) {
  const [filter, setFilter] = useState<IntroOutcome | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Intro | null>(null);

  const byId = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);
  const tableById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);

  const wentSomewhere = intros.filter((i) => i.outcome !== "no follow-through").length;

  const filtered = useMemo(() => {
    const list = filter === "all" ? intros : intros.filter((i) => i.outcome === filter);
    return [...list].sort((a, b) => {
      const da = tableById.get(a.tableId)?.date ?? "";
      const db = tableById.get(b.tableId)?.date ?? "";
      return db.localeCompare(da);
    });
  }, [intros, filter, tableById]);

  return (
    <div>
      {/* The slide */}
      <div className="border border-line rounded-none p-6 md:p-8 mb-8">
        <p className="font-serif font-normal text-[26px] md:text-[32px] leading-[1.2] tracking-[-0.025em] text-text">
          {tables.length} {tables.length === 1 ? "dinner" : "dinners"} ·{" "}
          {guests.length} {guests.length === 1 ? "guest" : "guests"} ·{" "}
          {intros.length} {intros.length === 1 ? "intro" : "intros"} logged ·{" "}
          {wentSomewhere} that went somewhere
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-4">
          The number that justifies the dinner budget
        </p>
      </div>

      <div className="flex items-end gap-4 mb-8 flex-wrap">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as IntroOutcome | "all")}
          className={`${inputCls} w-auto font-mono text-[10px] uppercase tracking-[0.08em] text-secondary`}
        >
          <option value="all">All outcomes</option>
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <PrimaryButton
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Log intro
        </PrimaryButton>
      </div>

      <div className="bg-card border border-line rounded-none divide-y divide-line">
        {filtered.map((i) => {
          const a = byId.get(i.a);
          const b = byId.get(i.b);
          const t = tableById.get(i.tableId);
          return (
            <div
              key={i.id}
              className="px-5 py-4 flex items-center gap-4 flex-wrap hover:bg-tile cursor-pointer transition-colors"
              onClick={() => {
                setEditing(i);
                setModalOpen(true);
              }}
            >
              <div className="min-w-[220px]">
                <p className="font-serif text-[18px] text-text leading-snug">
                  {a?.name} · {b?.name}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-1.5">
                  {t?.name} · {t?.date}
                </p>
              </div>
              <OutcomeBadge outcome={i.outcome} />
              <p className="text-[14.5px] leading-[1.55] text-secondary flex-1">
                {i.detail}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteIntro(i.id);
                  onRefresh();
                }}
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-danger transition-colors"
              >
                Remove
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="font-serif text-[20px] text-text">
              No intros logged{filter !== "all" ? " with this outcome" : ""} yet
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-3">
              Log one from a table to start the record
            </p>
          </div>
        )}
      </div>

      {modalOpen && (
        <IntroModal
          editing={editing}
          guests={guests}
          tables={tables}
          onClose={() => setModalOpen(false)}
          onSave={(i) => {
            upsertIntro(i);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
