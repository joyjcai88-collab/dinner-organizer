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
  createdAt: string;
}

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
