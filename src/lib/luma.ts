import Papa from "papaparse";
import { v4 as uuid } from "uuid";
import { Guest, Table } from "./types";
import { getGuests, saveGuests, upsertTable } from "./store";

/** One row of a Luma guest list, normalized from either the CSV export or the API. */
export interface LumaGuestRow {
  name: string;
  email: string;
  approvalStatus: string | null;
  checkedInAt: string | null;
}

export interface LumaEventInfo {
  name: string;
  date: string; // ISO date (yyyy-mm-dd)
  venue: string;
}

export interface ImportPlan {
  event: LumaEventInfo;
  isPast: boolean;
  /** brand-new people to create */
  newGuests: Guest[];
  /** rows matched to existing guests (by email, then exact name) */
  matched: { existing: Guest; row: LumaGuestRow }[];
  /** rows excluded because they didn't RSVP yes / weren't approved */
  skipped: LumaGuestRow[];
}

/** Statuses that count as "was actually coming" (normalized to lowercase). */
const GOING = new Set(["approved", "going", "attending", "checked in", "yes"]);

export function isGoing(row: LumaGuestRow): boolean {
  if (row.checkedInAt) return true;
  if (!row.approvalStatus) return true; // free events export without approval column
  return GOING.has(row.approvalStatus.trim().toLowerCase());
}

export function planLumaImport(
  rows: LumaGuestRow[],
  event: LumaEventInfo,
  existing: Guest[],
  includeNotGoing: boolean
): ImportPlan {
  const today = new Date().toISOString().slice(0, 10);
  const isPast = event.date <= today;

  const byEmail = new Map(
    existing.filter((g) => g.email).map((g) => [g.email.toLowerCase(), g])
  );
  const byName = new Map(existing.map((g) => [g.name.toLowerCase(), g]));

  const plan: ImportPlan = { event, isPast, newGuests: [], matched: [], skipped: [] };
  const seen = new Set<string>(); // dedupe rows within the file itself

  for (const row of rows) {
    if (!row.name.trim()) continue;
    const key = (row.email || row.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    if (!includeNotGoing && !isGoing(row)) {
      plan.skipped.push(row);
      continue;
    }

    const match =
      (row.email && byEmail.get(row.email.toLowerCase())) ||
      byName.get(row.name.trim().toLowerCase());

    if (match) {
      plan.matched.push({ existing: match, row });
    } else {
      plan.newGuests.push({
        id: uuid(),
        name: row.name.trim(),
        role: "other",
        company: "",
        title: "",
        email: row.email.trim(),
        linkedinUrl: "",
        sector: null,
        stage: null,
        strength: 1,
        socialEnergy: "medium",
        hosted: isPast ? 1 : 0,
        lastSeen: isPast ? event.date : null,
        notes: null,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return plan;
}

/** Create the guests and the table; returns the new table's id. */
export function applyLumaImport(plan: ImportPlan): string {
  const guests = getGuests();

  // update matched guests: a past dinner bumps hosted and refreshes lastSeen
  if (plan.isPast) {
    for (const { existing } of plan.matched) {
      const g = guests.find((x) => x.id === existing.id);
      if (!g) continue;
      g.hosted += 1;
      if (!g.lastSeen || g.lastSeen < plan.event.date) g.lastSeen = plan.event.date;
    }
  }
  // fill in emails we learned from Luma
  for (const { existing, row } of plan.matched) {
    const g = guests.find((x) => x.id === existing.id);
    if (g && !g.email && row.email) g.email = row.email.trim();
  }

  guests.push(...plan.newGuests);
  saveGuests(guests);

  const guestIds = [
    ...plan.matched.map((m) => m.existing.id),
    ...plan.newGuests.map((g) => g.id),
  ];
  const table: Table = {
    id: uuid(),
    name: plan.event.name,
    date: plan.event.date,
    venue: plan.event.venue,
    coHost: null,
    seats: Math.max(guestIds.length, 2),
    status: plan.isPast ? "past" : "upcoming",
    guestIds,
    seating: null,
    note: "Imported from Luma.",
  };
  upsertTable(table);
  return table.id;
}

/**
 * Parse the guest-list CSV a host downloads from a Luma event's Guests tab
 * (Manage → Guests → Download CSV). Verified against real exports: snake_case
 * headers, BOM prefix, ISO-8601 timestamps, one row per ticket, and online
 * events carrying a Yes/No `has_joined_event` column instead of `checked_in_at`.
 */
export function parseLumaCSV(csvText: string): LumaGuestRow[] {
  const clean = csvText.replace(/^﻿/, ""); // exports start with a BOM
  const result = Papa.parse(clean, { header: true, skipEmptyLines: true });
  const rows = result.data as Record<string, string>[];

  const pick = (row: Record<string, string>, ...keys: string[]) => {
    for (const k of keys) {
      // exact match first, then case-insensitive
      if (row[k]) return row[k];
      const found = Object.keys(row).find(
        (h) => h.trim().toLowerCase() === k.toLowerCase()
      );
      if (found && row[found]) return row[found];
    }
    return "";
  };

  return rows
    .map((row) => {
      const first = pick(row, "first_name", "First Name");
      const last = pick(row, "last_name", "Last Name");
      const name = (pick(row, "name", "Name") || `${first} ${last}`).trim();
      // online events replace checked_in_at with has_joined_event: Yes/No
      const joined = pick(row, "has_joined_event").trim().toLowerCase() === "yes";
      return {
        name,
        email: pick(row, "email", "Email").trim(),
        approvalStatus: pick(row, "approval_status", "Approval Status", "status") || null,
        checkedInAt:
          pick(row, "checked_in_at", "Checked In At") || (joined ? "joined online" : null),
      };
    })
    .filter((r) => r.name.length > 0);
}

/** "AI Infra Dinner - Guests - 2026-07-12-09-30-00.csv" → "AI Infra Dinner" */
export function eventNameFromFilename(filename: string): string | null {
  const base = filename.replace(/\.csv$/i, "");
  const m = base.match(/^(.+?)\s+-\s+Guests\s+-\s+[\d-]+$/i);
  return m ? m[1].trim() : null;
}
