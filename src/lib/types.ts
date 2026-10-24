export type Role = "founder" | "engineer" | "vc" | "operator" | "other";
export type SocialEnergy = "high" | "medium" | "low";

export interface Guest {
  id: string;
  name: string;
  role: Role;
  company: string;
  title: string;
  email: string;
  linkedinUrl: string;
  sector: string | null;
  stage: string | null;
  strength: number; // 1–5, relationship strength
  socialEnergy: SocialEnergy;
  hosted: number; // dinners attended
  lastSeen: string | null; // ISO date
  notes: string | null; // table memory: dietary, habits, seating flags
  dietary?: Dietary[]; // structured needs, summarised per table for the venue
  dietaryOther?: string | null; // anything the list doesn't cover
  createdAt: string;
}

export const DIETARY = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-free",
  "Dairy-free",
  "Nut allergy",
  "Shellfish allergy",
  "Halal",
  "Kosher",
  "No alcohol",
] as const;

export type Dietary = (typeof DIETARY)[number];

/** Where a guest stands for one table: RSVP before the dinner, attendance after. */
export type Attendance = "invited" | "confirmed" | "declined" | "attended" | "no-show";

export const ATTENDANCE_LABELS: Record<Attendance, string> = {
  invited: "Invited",
  confirmed: "Confirmed",
  declined: "Declined",
  attended: "Came",
  "no-show": "No-show",
};

export interface Table {
  id: string;
  name: string;
  date: string; // ISO date
  venue: string;
  coHost: string | null; // guest name
  seats: number;
  status: "past" | "upcoming";
  guestIds: string[];
  seating: string[] | null; // guest ids in order around the table
  note: string | null;
  attendance?: Record<string, Attendance>; // guest id → status; missing means the default for the table
  recapDone?: boolean; // the after-dinner recap has been filled in
  /** Guest ids whose attendance is already reflected in their dinner count and last seen.
   *  Missing on tables made before attendance existed: treated as everyone on a past table. */
  counted?: string[];
}

export const OUTCOMES = [
  "no follow-through",
  "stayed in touch",
  "working together",
  "hire",
  "investment",
  "co-founded",
] as const;

export type IntroOutcome = (typeof OUTCOMES)[number];

export interface Intro {
  id: string;
  tableId: string;
  a: string; // guest id
  b: string; // guest id
  outcome: IntroOutcome;
  detail: string | null;
}

export const ROLE_LABELS: Record<Role, string> = {
  founder: "Founder",
  engineer: "Engineer",
  vc: "Investor",
  operator: "Operator",
  other: "Other",
};
