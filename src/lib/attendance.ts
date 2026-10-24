// Attendance, the after-dinner recap and dietary summaries. Everything here is pure: it takes
// tables and guests and returns new ones, and the views decide when to save.

import { Attendance, Dietary, DIETARY, Guest, Table } from "./types";

/** A guest's status at a table. Tables from before attendance existed have none recorded:
 *  everyone on a past table came, everyone on an upcoming one is invited. */
export function statusOf(table: Table, guestId: string): Attendance {
  return table.attendance?.[guestId] ?? (table.status === "past" ? "attended" : "invited");
}

/** Guests still expected at the table (or who came, once it's over). */
export function isComing(status: Attendance): boolean {
  return status === "invited" || status === "confirmed" || status === "attended";
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** The dinner has happened and nobody has said how it went yet. */
export function recapDue(table: Table, on = today()): boolean {
  return !table.recapDone && !!table.date && table.date <= on;
}

/** Recap due on a dinner from the last 30 days: flagged in the table list. */
export function recapDueRecently(table: Table): boolean {
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  return recapDue(table) && table.date >= cutoff;
}

/** Counts of each status, for a one-line summary. */
export function attendanceCounts(table: Table): Partial<Record<Attendance, number>> {
  const counts: Partial<Record<Attendance, number>> = {};
  for (const id of table.guestIds) {
    const s = statusOf(table, id);
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts;
}

function alreadyCounted(table: Table): Set<string> {
  // Before attendance existed, a past table's guests were counted when it was imported or
  // their numbers were typed in by hand, so assume they're in the totals already.
  return new Set(table.counted ?? (table.status === "past" ? table.guestIds : []));
}

/**
 * Apply a finished recap. Guests who came get the dinner added to their count and last seen;
 * guests now marked absent who had been counted get it taken back off. Returns the guests that
 * changed and the updated table.
 */
export function applyRecap(
  table: Table,
  statuses: Record<string, Attendance>,
  guests: Guest[],
  note: string | null
): { table: Table; changed: Guest[] } {
  const counted = alreadyCounted(table);
  const nowCounted = new Set<string>();
  const changed: Guest[] = [];
  for (const id of table.guestIds) {
    const came = statuses[id] === "attended";
    const g = guests.find((x) => x.id === id);
    if (came) nowCounted.add(id);
    if (!g) continue;
    if (came && !counted.has(id)) {
      changed.push({
        ...g,
        hosted: g.hosted + 1,
        lastSeen: !g.lastSeen || g.lastSeen < table.date ? table.date : g.lastSeen,
      });
    } else if (!came && counted.has(id)) {
      changed.push({ ...g, hosted: Math.max(0, g.hosted - 1) });
    }
  }
  return {
    table: {
      ...table,
      status: "past",
      attendance: { ...table.attendance, ...statuses },
      counted: [...nowCounted],
      recapDone: true,
      note,
    },
    changed,
  };
}

/** Dietary needs of the guests coming to a table, most common first. */
export function dietarySummary(table: Table, guests: Guest[]) {
  const coming = table.guestIds
    .filter((id) => isComing(statusOf(table, id)))
    .map((id) => guests.find((g) => g.id === id))
    .filter((g): g is Guest => !!g);
  const byNeed = new Map<Dietary, string[]>();
  const other: { name: string; text: string }[] = [];
  for (const g of coming) {
    for (const d of g.dietary ?? []) byNeed.set(d, [...(byNeed.get(d) ?? []), g.name]);
    if (g.dietaryOther?.trim()) other.push({ name: g.name, text: g.dietaryOther.trim() });
  }
  const needs = [...byNeed.entries()]
    .map(([need, names]) => ({ need, names }))
    .sort((a, b) => b.names.length - a.names.length || DIETARY.indexOf(a.need) - DIETARY.indexOf(b.need));
  return { coming: coming.length, needs, other };
}

/** "2 vegetarian · 1 nut allergy" */
export function dietaryLine(summary: ReturnType<typeof dietarySummary>): string {
  const parts = summary.needs.map((n) => `${n.names.length} ${n.need.toLowerCase()}`);
  if (summary.other.length) parts.push(`${summary.other.length} other`);
  return parts.join(" · ");
}

/** A note to send the venue: headcount, then each need with who has it. */
export function venueNote(table: Table, summary: ReturnType<typeof dietarySummary>): string {
  const lines = [`${table.name} · ${table.date} · ${summary.coming} guests`];
  if (!summary.needs.length && !summary.other.length) lines.push("No dietary requirements.");
  for (const n of summary.needs) lines.push(`${n.need}: ${n.names.length} (${n.names.join(", ")})`);
  for (const o of summary.other) lines.push(`${o.name}: ${o.text}`);
  return lines.join("\n");
}
