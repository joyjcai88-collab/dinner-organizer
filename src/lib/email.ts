// Pure rendering for the dinner invite. No network calls, no per-recipient
// personalization: the app never sends email itself, it only composes one
// message that the host hands off to their own mail client (see
// EmailGuestsModal.tsx), addressed to the whole guest list at once.

import { parseISO, format } from "date-fns";

export interface DinnerDetails {
  name: string;
  date: string; // ISO date, e.g. "2026-08-15"
  venue: string;
  coHost: string | null;
  note: string | null;
}

export interface OtherGuest {
  name: string;
  company: string;
}

export interface RenderedInvite {
  subject: string;
  body: string;
}

function formatDate(iso: string): string {
  try {
    // parseISO reads a date-only string as local midnight, unlike `new
    // Date(iso)` which reads it as UTC midnight and can print the wrong day
    // depending on the reader's timezone.
    return format(parseISO(iso), "EEEE, MMMM d, yyyy");
  } catch {
    return iso;
  }
}

/** Render the invite for the whole guest list. Pure, no I/O. */
export function renderInvite(
  dinner: DinnerDetails,
  otherGuests: OtherGuest[] | null
): RenderedInvite {
  const dateLabel = formatDate(dinner.date);
  const venueLabel = dinner.venue.trim() || "TBD";
  const subject = `Dinner details: ${dinner.name}`;

  const lines: string[] = [];
  lines.push("Hi all,");
  lines.push("");
  lines.push(`Here are the details for ${dinner.name}.`);
  lines.push("");
  lines.push(`Date: ${dateLabel}`);
  lines.push(`Venue: ${venueLabel}`);
  if (dinner.coHost) {
    lines.push(`Co-hosted with: ${dinner.coHost}`);
  }
  if (dinner.note) {
    lines.push("");
    lines.push(dinner.note);
  }
  if (otherGuests && otherGuests.length > 0) {
    lines.push("");
    lines.push("Also coming:");
    for (const g of otherGuests) {
      lines.push(`- ${g.name}${g.company ? `, ${g.company}` : ""}`);
    }
  }
  lines.push("");
  lines.push("See you there.");

  return { subject, body: lines.join("\n") };
}
