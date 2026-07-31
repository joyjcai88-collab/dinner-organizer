import Papa from "papaparse";
import { v4 as uuid } from "uuid";
import { Guest, Role } from "./types";

const ROLE_KEYWORDS: Record<Role, string[]> = {
  founder: ["founder", "co-founder", "cofounder", "ceo", "chief executive"],
  engineer: [
    "engineer",
    "developer",
    "cto",
    "technical",
    "software",
    "swe",
    "dev",
    "architect",
    "programming",
  ],
  vc: [
    "venture",
    "investor",
    "partner",
    "capital",
    "investment",
    "managing director",
    "principal",
    "associate",
    "analyst",
    "vc",
  ],
  operator: [
    "operator",
    "coo",
    "operations",
    "head of",
    "vp",
    "director",
    "manager",
    "growth",
    "marketing",
    "sales",
    "product",
  ],
  other: [],
};

function inferRole(title: string): Role {
  const lower = title.toLowerCase();
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (role === "other") continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return role as Role;
    }
  }
  return "other";
}

/** Parses the CSV LinkedIn exports from Settings → Data Privacy → Get a copy of your data. */
export function parseLinkedInCSV(csvText: string): Guest[] {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  return (result.data as Record<string, string>[])
    .map((row) => {
      const firstName = row["First Name"] || row["firstName"] || row["first_name"] || "";
      const lastName = row["Last Name"] || row["lastName"] || row["last_name"] || "";
      const name = (row["Name"] || `${firstName} ${lastName}`).trim();
      const company = row["Company"] || row["company"] || row["Organization"] || "";
      const title = row["Position"] || row["Title"] || row["title"] || row["Headline"] || "";
      const email = row["Email Address"] || row["Email"] || row["email"] || "";
      const linkedinUrl = row["Profile URL"] || row["URL"] || row["linkedinUrl"] || "";

      const guest: Guest = {
        id: uuid(),
        name,
        role: inferRole(title),
        company: company.trim(),
        title: title.trim(),
        email: email.trim(),
        linkedinUrl: linkedinUrl.trim(),
        sector: null,
        stage: null,
        strength: 1,
        socialEnergy: "medium",
        hosted: 0,
        lastSeen: null,
        notes: null,
        createdAt: new Date().toISOString(),
      };
      return guest;
    })
    .filter((g) => g.name.length > 0);
}

export function exportGuestsCSV(guests: Guest[]): string {
  return Papa.unparse(
    guests.map((g) => ({
      Name: g.name,
      Role: g.role,
      Company: g.company,
      Title: g.title,
      Email: g.email,
      "LinkedIn URL": g.linkedinUrl,
      Sector: g.sector || "",
      Stage: g.stage || "",
      Strength: g.strength,
      "Social Energy": g.socialEnergy,
      Hosted: g.hosted,
      "Last Seen": g.lastSeen || "",
      Notes: g.notes || "",
    }))
  );
}
