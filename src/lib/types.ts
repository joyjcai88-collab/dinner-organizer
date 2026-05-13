export type ContactRole = "founder" | "engineer" | "vc" | "operator" | "other";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: ContactRole;
  company: string;
  title: string;
  email: string;
  linkedinUrl: string;
  tags: string[];
  notes: string;
  eventsAttended: number;
  lastEventDate: string | null;
  createdAt: string;
}

export interface DinnerEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  hostFirm: string;
  capacity: number;
  guests: string[]; // contact IDs
  status: "draft" | "confirmed" | "completed" | "cancelled";
  roleMix: RoleMix;
  notes: string;
  createdAt: string;
}

export interface RoleMix {
  founder: number;
  engineer: number;
  vc: number;
  operator: number;
  other: number;
}

export interface RandomizationConfig {
  capacity: number;
  roleMix: RoleMix;
  excludeRecentAttendees: boolean;
  recentWindowDays: number;
  excludeContactIds: string[];
  preferTags: string[];
}
