import { Role } from "./types";

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getHeaders(): Record<string, string> {
  return {
    "User-Agent": randomUA(),
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };
}

async function fetchWithRetry(
  url: string,
  maxRetries = 3
): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: getHeaders(),
        redirect: "follow",
      });
      if ([429, 999, 403].includes(resp.status)) {
        const wait = 2 ** attempt + Math.random() * 1.5;
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }
      if (!resp.ok) return null;
      return await resp.text();
    } catch {
      const wait = 2 ** attempt + Math.random() * 1.5;
      await new Promise((r) => setTimeout(r, wait * 1000));
    }
  }
  return null;
}

export interface LinkedInProfile {
  profileUrl: string;
  name: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  location: string;
  company: string;
  title: string;
  connections: number;
  experience: { title: string; company: string }[];
  education: { school: string; degree: string }[];
  skills: string[];
  role: Role;
}

/** Maps a freeform title/headline to the app's Role. Falls back to "other". */
function inferRole(title: string): Role {
  const lower = title.toLowerCase();
  const roleKeywords: Record<string, string[]> = {
    founder: ["founder", "co-founder", "cofounder", "ceo", "chief executive"],
    engineer: [
      "engineer",
      "developer",
      "cto",
      "technical",
      "software",
      "swe",
      "architect",
    ],
    vc: [
      "venture",
      "investor",
      "partner",
      "capital",
      "investment",
      "managing director",
      "principal",
      "vc",
    ],
    operator: [
      "operator",
      "coo",
      "operations",
      "head of",
      "vp",
      "director",
      "growth",
      "marketing",
      "sales",
      "product",
    ],
  };
  for (const [role, keywords] of Object.entries(roleKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return role as Role;
    }
  }
  return "other";
}

function parseLinkedInDescription(desc: string): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (!desc) return result;

  const segments = desc.split(/\s*[·|–—]\s*/);
  for (const raw of segments) {
    const segment = raw.trim();
    if (!segment) continue;

    const connMatch = segment.match(/(\d[\d,]*)\+?\s*connections?/i);
    if (connMatch) {
      result.connections = parseInt(connMatch[1].replace(",", ""));
      continue;
    }
    const expMatch = segment.match(/^Experience:?\s*(.+)/i);
    if (expMatch) {
      result.experience_text = expMatch[1].trim();
      continue;
    }
    const eduMatch = segment.match(/^Education:?\s*(.+)/i);
    if (eduMatch) {
      result.education_text = eduMatch[1].trim();
      continue;
    }
    const locMatch = segment.match(/^Location:?\s*(.+)/i);
    if (locMatch) {
      result.location = locMatch[1].trim();
      continue;
    }
    if (!result.headline && segment.length > 3 && segment.length < 80) {
      result.headline = segment;
    }
  }
  return result;
}

function extractMetaContent(html: string, property: string): string {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const match = html.match(pattern);
  if (match) return match[1];
  const pattern2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  const match2 = html.match(pattern2);
  return match2 ? match2[1] : "";
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const pattern =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (
        typeof data === "object" &&
        data !== null &&
        (data["@type"] === "Person" || data.name)
      ) {
        return data;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function searchLinkedInProfiles(
  query: string
): Promise<string[]> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
    `site:linkedin.com/in ${query}`
  )}`;
  const html = await fetchWithRetry(searchUrl);
  if (!html) return [];

  const urls: string[] = [];
  const linkPattern =
    /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/g;
  let match;
  const seen = new Set<string>();
  while ((match = linkPattern.exec(html)) !== null) {
    const slug = match[1];
    if (
      !seen.has(slug) &&
      !["login", "signup", "feed", "pulse", "directory"].includes(slug)
    ) {
      seen.add(slug);
      urls.push(`https://www.linkedin.com/in/${slug}`);
    }
  }
  return urls.slice(0, 10);
}

export async function scrapeLinkedInProfile(
  url: string
): Promise<LinkedInProfile | null> {
  await new Promise((r) =>
    setTimeout(r, 500 + Math.random() * 1000)
  );

  const html = await fetchWithRetry(url);
  if (!html) return null;

  let name = "";
  let headline = "";
  let summary = "";
  let location = "";
  let connections = 0;
  const experience: { title: string; company: string }[] = [];
  const education: { school: string; degree: string }[] = [];
  let skills: string[] = [];

  // OpenGraph tags
  const ogTitle = extractMetaContent(html, "og:title");
  const ogDesc = extractMetaContent(html, "og:description");

  if (ogTitle) {
    const cleaned = ogTitle.replace(/\s*\|\s*LinkedIn\s*$/, "");
    const parts = cleaned.split(" - ");
    name = parts[0]?.trim() || "";
    if (parts.length > 1) headline = parts.slice(1).join(" - ").trim();
  }

  if (ogDesc) {
    const parsed = parseLinkedInDescription(ogDesc);
    if (!headline && parsed.headline) headline = parsed.headline as string;
    if (parsed.location) location = parsed.location as string;
    if (parsed.connections) connections = parsed.connections as number;
    if (parsed.experience_text) {
      experience.push({
        title: "",
        company: parsed.experience_text as string,
      });
    }
    if (parsed.education_text) {
      education.push({
        school: parsed.education_text as string,
        degree: "",
      });
    }
    if (!summary) summary = ogDesc.slice(0, 500);
  }

  // JSON-LD
  const jsonld = extractJsonLd(html);
  if (jsonld) {
    if (!headline && jsonld.jobTitle)
      headline = jsonld.jobTitle as string;
    if (!summary && jsonld.description)
      summary = (jsonld.description as string).slice(0, 500);

    if (!location && jsonld.address) {
      const addr = jsonld.address as Record<string, string>;
      if (typeof addr === "object") {
        location = [addr.addressLocality, addr.addressCountry]
          .filter(Boolean)
          .join(", ");
      } else if (typeof addr === "string") {
        location = addr;
      }
    }

    if (experience.length === 0 && jsonld.worksFor) {
      const works = Array.isArray(jsonld.worksFor)
        ? jsonld.worksFor
        : [jsonld.worksFor];
      for (const w of works) {
        if (typeof w === "object" && w && (w as Record<string, string>).name) {
          experience.push({
            title: (jsonld.jobTitle as string) || "",
            company: (w as Record<string, string>).name,
          });
        }
      }
    }

    if (education.length === 0 && jsonld.alumniOf) {
      const alumni = Array.isArray(jsonld.alumniOf)
        ? jsonld.alumniOf
        : [jsonld.alumniOf];
      for (const e of alumni) {
        if (typeof e === "object" && e && (e as Record<string, string>).name) {
          education.push({
            school: (e as Record<string, string>).name,
            degree: "",
          });
        }
      }
    }

    if (skills.length === 0 && jsonld.knowsAbout) {
      const knows = jsonld.knowsAbout;
      if (Array.isArray(knows)) {
        skills = knows.map(String).slice(0, 30);
      } else if (typeof knows === "string") {
        skills = knows.split(",").map((s: string) => s.trim());
      }
    }
  }

  // Extract from page title as fallback
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && !name) {
    const cleaned = titleMatch[1]
      .replace(/\s*\|\s*LinkedIn\s*$/, "")
      .trim();
    const parts = cleaned.split(" - ");
    name = parts[0]?.trim() || "";
    if (!headline && parts.length > 1)
      headline = parts.slice(1).join(" - ").trim();
  }

  if (!name) return null;

  const { firstName, lastName } = splitName(name);
  const currentCompany =
    experience[0]?.company || headline.split(/\s+at\s+/i)[1] || "";
  const currentTitle =
    experience[0]?.title || headline.split(/\s+at\s+/i)[0] || headline;

  return {
    profileUrl: url,
    name,
    firstName,
    lastName,
    headline,
    summary,
    location,
    company: currentCompany,
    title: currentTitle,
    connections,
    experience,
    education,
    skills,
    role: inferRole(currentTitle || headline),
  };
}

export async function scrapeLinkedInByName(
  name: string,
  company?: string
): Promise<LinkedInProfile | null> {
  const query = company ? `${name} ${company}` : name;
  const urls = await searchLinkedInProfiles(query);
  if (urls.length === 0) return null;
  return scrapeLinkedInProfile(urls[0]);
}
