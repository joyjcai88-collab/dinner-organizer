import Papa from "papaparse";
import { v4 as uuid } from "uuid";
import { Contact, ContactRole } from "./types";

const ROLE_KEYWORDS: Record<ContactRole, string[]> = {
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

function inferRole(title: string): ContactRole {
  const lower = title.toLowerCase();
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (role === "other") continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return role as ContactRole;
    }
  }
  return "other";
}

export function parseLinkedInCSV(csvText: string): Contact[] {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  return (result.data as Record<string, string>[]).map((row) => {
    const firstName = row["First Name"] || row["firstName"] || row["first_name"] || "";
    const lastName = row["Last Name"] || row["lastName"] || row["last_name"] || "";
    const company = row["Company"] || row["company"] || row["Organization"] || "";
    const title = row["Position"] || row["Title"] || row["title"] || row["Headline"] || "";
    const email = row["Email Address"] || row["Email"] || row["email"] || "";
    const linkedinUrl = row["Profile URL"] || row["URL"] || row["linkedinUrl"] || "";

    return {
      id: uuid(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: inferRole(title),
      company: company.trim(),
      title: title.trim(),
      email: email.trim(),
      linkedinUrl: linkedinUrl.trim(),
      tags: [],
      notes: "",
      eventsAttended: 0,
      lastEventDate: null,
      createdAt: new Date().toISOString(),
    };
  });
}

export function exportContactsCSV(contacts: Contact[]): string {
  return Papa.unparse(
    contacts.map((c) => ({
      "First Name": c.firstName,
      "Last Name": c.lastName,
      Role: c.role,
      Company: c.company,
      Title: c.title,
      Email: c.email,
      "LinkedIn URL": c.linkedinUrl,
      Tags: c.tags.join("; "),
      "Events Attended": c.eventsAttended,
      "Last Event": c.lastEventDate || "",
    }))
  );
}
