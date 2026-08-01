"use client";

import { useMemo } from "react";
import { Guest, Table } from "@/lib/types";
import { upsertTable } from "@/lib/store";
import { monthsSince } from "@/lib/seating";
import { RoleBadge, StrengthBar, LastSeen, LinkButton } from "./ui";

interface Props {
  guests: Guest[];
  tables: Table[];
  onRefresh: () => void;
}

// Row and Section live at module scope on purpose. Declaring them inside
// OverdueView made them a new component type on every render, so React threw
// the whole list away and rebuilt it each time state changed.
function Row({
  g,
  nextTable,
  onSeat,
}: {
  g: Guest;
  nextTable: Table | null;
  onSeat: (g: Guest) => void;
}) {
  const onNext = nextTable?.guestIds.includes(g.id) ?? false;
  return (
    <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
      <div className="min-w-[200px]">
        <p className="font-serif text-[18px] text-text leading-snug">{g.name}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-1.5">
          {g.company}
        </p>
      </div>
      <RoleBadge role={g.role} />
      <StrengthBar value={g.strength} />
      <p className="text-[14.5px] whitespace-nowrap">
        <LastSeen iso={g.lastSeen} />
      </p>
      {g.notes && (
        <p className="text-[14.5px] text-secondary flex-1 truncate max-w-xs">
          {g.notes}
        </p>
      )}
      <div className="ml-auto">
        {nextTable &&
          (onNext ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              On {nextTable.name}
            </span>
          ) : (
            <LinkButton onClick={() => onSeat(g)}>+ Seat at next table</LinkButton>
          ))}
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  list,
  nextTable,
  onSeat,
}: {
  title: string;
  hint: string;
  list: Guest[];
  nextTable: Table | null;
  onSeat: (g: Guest) => void;
}) {
  return (
    <div className="mb-12">
      <div className="flex items-baseline gap-4 mb-4 flex-wrap">
        <h2 className="font-serif font-normal text-[26px] tracking-[-0.025em] text-text">
          {title}
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          {hint}
        </p>
      </div>
      {list.length === 0 ? (
        <div className="bg-card border border-line rounded-none px-6 py-12 text-center">
          <p className="font-serif text-[20px] text-text">Nobody here</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-3">
            Keep it that way
          </p>
        </div>
      ) : (
        <div className="bg-card border border-line rounded-none divide-y divide-line">
          {list.map((g) => (
            <Row key={g.id} g={g} nextTable={nextTable} onSeat={onSeat} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OverdueView({ guests, tables, onRefresh }: Props) {
  const nextTable = useMemo(
    () =>
      tables
        .filter((t) => t.status === "upcoming")
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null,
    [tables]
  );

  const byStaleness = (list: Guest[]) =>
    [...list].sort((a, b) => b.strength - a.strength);

  const overdue = useMemo(
    () => byStaleness(guests.filter((g) => (monthsSince(g.lastSeen) ?? Infinity) >= 6)),
    [guests]
  );
  const goingQuiet = useMemo(
    () =>
      byStaleness(
        guests.filter((g) => {
          const m = monthsSince(g.lastSeen);
          return m !== null && m >= 3 && m < 6;
        })
      ),
    [guests]
  );

  // attended 3+ times, never co-hosted → ready to co-host
  const coHostNames = useMemo(
    () => new Set(tables.map((t) => t.coHost).filter(Boolean)),
    [tables]
  );
  const coHostPipeline = useMemo(
    () =>
      guests
        .filter((g) => g.hosted >= 3 && !coHostNames.has(g.name))
        .sort((a, b) => b.hosted - a.hosted),
    [guests, coHostNames]
  );

  const addToNextTable = (g: Guest) => {
    if (!nextTable) return;
    upsertTable({
      ...nextTable,
      guestIds: [...nextTable.guestIds, g.id],
      seating: null,
    });
    onRefresh();
  };

  return (
    <div>
      <Section
        title="Overdue"
        hint="6+ months · strongest ties first"
        list={overdue}
        nextTable={nextTable}
        onSeat={addToNextTable}
      />
      <Section
        title="Going quiet"
        hint="3 to 6 months since you saw them"
        list={goingQuiet}
        nextTable={nextTable}
        onSeat={addToNextTable}
      />
      <Section
        title="Co-host pipeline"
        hint="Attended 3+ dinners, never hosted one with you"
        list={coHostPipeline}
        nextTable={nextTable}
        onSeat={addToNextTable}
      />
    </div>
  );
}
