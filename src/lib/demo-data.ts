import { Guest, Intro, Table } from "./types";

// All names and companies are invented. Do not substitute real people.

const g = (
  id: string,
  name: string,
  role: Guest["role"],
  company: string,
  sector: string | null,
  stage: string | null,
  strength: number,
  socialEnergy: Guest["socialEnergy"],
  hosted: number,
  lastSeen: string,
  notes: string | null
): Guest => ({
  id,
  name,
  role,
  company,
  title: "",
  email: "",
  linkedinUrl: "",
  sector,
  stage,
  strength,
  socialEnergy,
  hosted,
  lastSeen,
  notes,
  createdAt: "2026-01-01T00:00:00.000Z",
});

// One dinner, the people who were at it, and what came of it. Enough to show
// how the app works without looking like someone else's half-finished CRM.
export const DEMO_GUESTS: Guest[] = [
  g("g1", "Priya Raghunathan", "founder", "Loomwork", "devtools", "seed", 5, "high", 4, "2026-07-11", "Vegetarian. Great connector: seat her near anyone shy."),
  g("g2", "Marcus Oyelaran", "engineer", "Stripe", "fintech", null, 4, "medium", 3, "2026-07-11", "Always ~20 min late. Wants to found something in 2027."),
  g("g3", "Dana Whitfield", "vc", "Kestrel Capital", "healthtech", "seed", 5, "high", 6, "2026-07-11", "No alcohol. Will co-host: has offered twice."),
  g("g5", "Aisha Nkemdirim", "operator", "Ramp", "fintech", null, 4, "high", 2, "2026-06-19", "Shellfish allergy: flag it with the venue every time."),
  g("g8", "Rosalie Duchamp", "engineer", "Anthropic", "ai", null, 3, "low", 1, "2026-06-19", "Gluten-free. Deep on evals."),
  g("g9", "Samuel Achebe", "founder", "Northgate AI", "ai", "series-a", 4, "high", 3, "2026-07-11", "Hires out of these dinners. Ask about his open roles."),
  g("g12", "Helena Vasquez", "vc", "Two Rivers", "ai", "seed", 4, "medium", 2, "2026-07-11", null),
  g("g13", "Caleb Whitmore", "engineer", "Vercel", "devtools", null, 3, "high", 2, "2026-06-19", null),
  g("g14", "Noor Hadid", "founder", "Skiff Logistics", "logistics", "seed", 2, "medium", 1, "2026-01-28", "Overdue. Raising in Q4."),
];

export const DEMO_TABLES: Table[] = [
  {
    id: "t1",
    name: "AI infra, off the record",
    date: "2026-07-11",
    venue: "The Battery",
    coHost: "Samuel Achebe",
    seats: 9,
    status: "past",
    guestIds: ["g1", "g2", "g3", "g9", "g12", "g8", "g13", "g5", "g14"],
    seating: ["g8", "g9", "g14", "g12", "g2", "g1", "g3", "g13", "g5"],
    note: "Rosalie next to Samuel paid for the whole evening.",
  },
];

export const DEMO_INTROS: Intro[] = [
  { id: "i1", tableId: "t1", a: "g8", b: "g9", outcome: "hire", detail: "Rosalie referred Northgate its first eval engineer." },
  { id: "i2", tableId: "t1", a: "g2", b: "g9", outcome: "stayed in touch", detail: "Marcus advising on payments." },
  { id: "i3", tableId: "t1", a: "g12", b: "g14", outcome: "no follow-through", detail: null },
];
