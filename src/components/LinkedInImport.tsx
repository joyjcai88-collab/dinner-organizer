"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Contact, ContactRole } from "@/lib/types";
import type { LinkedInProfile } from "@/lib/linkedin";

type Mode = "url" | "search" | "bulk" | "csv";

const ROLE_COLORS: Record<ContactRole, string> = {
  founder: "bg-hf-gold/20 text-hf-dark",
  engineer: "bg-hf-dark/10 text-hf-dark",
  vc: "bg-hf-gold/40 text-hf-dark",
  operator: "bg-hf-cream text-hf-dark border border-hf-border",
  other: "bg-hf-hover text-hf-muted",
};

function profileToContact(p: LinkedInProfile): Contact {
  return {
    id: uuid(),
    firstName: p.firstName,
    lastName: p.lastName,
    role: p.role,
    company: p.company,
    title: p.title || p.headline,
    email: "",
    linkedinUrl: p.profileUrl,
    tags: [],
    notes: p.summary?.slice(0, 200) || "",
    eventsAttended: 0,
    lastEventDate: null,
    createdAt: new Date().toISOString(),
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (contacts: Contact[]) => void;
}

export default function LinkedInImport({ open, onClose, onImport }: Props) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<LinkedInProfile[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  if (!open) return null;

  const reset = () => {
    setResults([]);
    setSelected(new Set());
    setError("");
    setProgress({ done: 0, total: 0 });
  };

  const fetchProfile = async (profileUrl: string): Promise<LinkedInProfile | null> => {
    const resp = await fetch("/api/linkedin/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: profileUrl }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.profile;
  };

  const handleUrlLookup = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    reset();
    try {
      const profile = await fetchProfile(url.trim());
      if (profile) {
        setResults([profile]);
        setSelected(new Set([0]));
      } else {
        setError("Could not fetch that profile. It may be private or the URL may be incorrect.");
      }
    } catch {
      setError("Failed to fetch profile.");
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    setError("");
    reset();
    try {
      const resp = await fetch("/api/linkedin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: searchName.trim(),
          company: searchCompany.trim() || undefined,
        }),
      });
      if (!resp.ok) {
        setError("No profile found for that name.");
        setLoading(false);
        return;
      }
      const data = await resp.json();
      if (data.profile) {
        setResults([data.profile]);
        setSelected(new Set([0]));
      }
    } catch {
      setError("Search failed.");
    }
    setLoading(false);
  };

  const handleBulk = async () => {
    const urls = bulkUrls
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.match(/linkedin\.com\/in\//));
    if (urls.length === 0) {
      setError("No valid LinkedIn URLs found. Paste one URL per line.");
      return;
    }
    setLoading(true);
    setError("");
    reset();
    setProgress({ done: 0, total: urls.length });

    const profiles: LinkedInProfile[] = [];
    for (let i = 0; i < urls.length; i++) {
      const profile = await fetchProfile(urls[i]);
      if (profile) profiles.push(profile);
      setProgress({ done: i + 1, total: urls.length });
      if (i < urls.length - 1) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
    setResults(profiles);
    setSelected(new Set(profiles.map((_, i) => i)));
    if (profiles.length === 0) {
      setError("Could not fetch any profiles. They may be private.");
    }
    setLoading(false);
  };

  const toggleSelect = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const handleImport = () => {
    const contacts = results
      .filter((_, i) => selected.has(i))
      .map(profileToContact);
    onImport(contacts);
    reset();
    setUrl("");
    setSearchName("");
    setSearchCompany("");
    setBulkUrls("");
    onClose();
  };

  const inputClass =
    "w-full px-3 py-2.5 border border-hf-border rounded-none bg-white focus:ring-2 focus:ring-hf-gold focus:border-hf-gold text-hf-text text-sm";
  const labelClass =
    "block font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-hf-border max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-hf-text">
            Import from LinkedIn
          </h2>
          <button
            onClick={onClose}
            className="text-hf-muted hover:text-hf-dark text-xl"
          >
            &times;
          </button>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-6">
          Pull contact details directly from LinkedIn profiles
        </p>

        {/* Mode tabs */}
        <div className="flex border border-hf-border mb-6">
          {(
            [
              ["url", "Profile URL"],
              ["search", "Name Search"],
              ["bulk", "Bulk Import"],
              ["csv", "CSV Guide"],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                reset();
              }}
              className={`flex-1 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors border-r last:border-r-0 border-hf-border ${
                mode === m
                  ? "bg-hf-dark text-white"
                  : "text-hf-muted hover:text-hf-dark hover:bg-hf-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Profile URL mode */}
        {mode === "url" && (
          <div>
            <label className={labelClass}>LinkedIn Profile URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
                className={`flex-1 ${inputClass}`}
                onKeyDown={(e) => e.key === "Enter" && handleUrlLookup()}
              />
              <button
                onClick={handleUrlLookup}
                disabled={loading || !url.trim()}
                className="relative px-5 py-2.5 bg-hf-dark text-white font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-dark/90 disabled:opacity-40 transition-colors"
              >
                {loading ? "Fetching..." : "Lookup"}
                <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-hf-gold" />
              </button>
            </div>
          </div>
        )}

        {/* Name search mode */}
        {mode === "search" && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g. Sarah Chen"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Company{" "}
                <span className="text-hf-muted/60">(optional, improves accuracy)</span>
              </label>
              <input
                type="text"
                value={searchCompany}
                onChange={(e) => setSearchCompany(e.target.value)}
                placeholder="e.g. Stripe"
                className={inputClass}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchName.trim()}
              className="relative w-full px-4 py-2.5 bg-hf-dark text-white font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-dark/90 disabled:opacity-40 transition-colors"
            >
              {loading ? "Searching..." : "Find on LinkedIn"}
              <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-gold" />
            </button>
          </div>
        )}

        {/* Bulk import mode */}
        {mode === "bulk" && (
          <div>
            <label className={labelClass}>
              LinkedIn Profile URLs{" "}
              <span className="text-hf-muted/60">(one per line)</span>
            </label>
            <textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              rows={6}
              placeholder={
                "https://linkedin.com/in/person1\nhttps://linkedin.com/in/person2\nhttps://linkedin.com/in/person3"
              }
              className={`${inputClass} font-mono`}
            />
            <button
              onClick={handleBulk}
              disabled={loading || !bulkUrls.trim()}
              className="relative mt-3 w-full px-4 py-2.5 bg-hf-dark text-white font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-dark/90 disabled:opacity-40 transition-colors"
            >
              {loading
                ? `Fetching... (${progress.done}/${progress.total})`
                : "Fetch All Profiles"}
              <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-gold" />
            </button>
          </div>
        )}

        {/* CSV guide mode */}
        {mode === "csv" && (
          <div className="space-y-4">
            <div className="bg-hf-cream p-5">
              <h3 className="font-[family-name:var(--font-dm-serif)] text-lg text-hf-text mb-3">
                Export your LinkedIn connections
              </h3>
              <ol className="space-y-2.5 text-sm text-hf-text">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-hf-dark text-white flex items-center justify-center font-mono text-xs">
                    1
                  </span>
                  <span>
                    Go to <strong>LinkedIn Settings</strong> &rarr;{" "}
                    <strong>Data Privacy</strong>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-hf-dark text-white flex items-center justify-center font-mono text-xs">
                    2
                  </span>
                  <span>
                    Click <strong>Get a copy of your data</strong>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-hf-dark text-white flex items-center justify-center font-mono text-xs">
                    3
                  </span>
                  <span>
                    Select <strong>Connections</strong> and click{" "}
                    <strong>Request archive</strong>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-hf-dark text-white flex items-center justify-center font-mono text-xs">
                    4
                  </span>
                  <span>Wait for the email (~10 min), download the ZIP</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-hf-dark text-white flex items-center justify-center font-mono text-xs">
                    5
                  </span>
                  <span>
                    Extract and use <strong>Import CSV</strong> on the Contacts tab with
                    the{" "}
                    <code className="px-1 py-0.5 bg-hf-dark/10 font-mono text-xs">
                      Connections.csv
                    </code>{" "}
                    file
                  </span>
                </li>
              </ol>
            </div>
            <p className="text-xs text-hf-muted">
              The CSV export includes name, company, position, and email for all your
              connections. Our importer auto-detects LinkedIn&apos;s format and assigns
              roles based on job titles.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading progress */}
        {loading && progress.total > 1 && (
          <div className="mt-4">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-hf-muted mb-1">
              <span>Fetching profiles...</span>
              <span>
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-hf-border h-1.5">
              <div
                className="bg-hf-gold h-1.5 transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted">
                Found {results.length} profile{results.length > 1 ? "s" : ""}
              </h3>
              <div className="flex gap-3 font-mono text-[10px] uppercase tracking-wider">
                <button
                  onClick={() => setSelected(new Set(results.map((_, i) => i)))}
                  className="text-hf-dark hover:text-hf-gold transition-colors"
                >
                  Select all
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-hf-dark hover:text-hf-gold transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((p, i) => (
                <div
                  key={i}
                  onClick={() => toggleSelect(i)}
                  className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                    selected.has(i)
                      ? "border-hf-gold bg-hf-gold/10"
                      : "border-hf-border hover:bg-hf-cream"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleSelect(i)}
                    className="mt-1 rounded-none border-hf-border text-hf-dark focus:ring-hf-gold accent-hf-gold"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-hf-text">
                        {p.firstName} {p.lastName}
                      </span>
                      <span
                        className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${ROLE_COLORS[p.role]}`}
                      >
                        {p.role}
                      </span>
                    </div>
                    <p className="text-sm text-hf-muted truncate">
                      {p.title || p.headline}
                    </p>
                    <p className="text-xs text-hf-muted/60 truncate">
                      {p.company}
                      {p.location ? ` · ${p.location}` : ""}
                      {p.connections ? ` · ${p.connections}+ connections` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import button */}
        {results.length > 0 && (
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                reset();
                onClose();
              }}
              className="flex-1 px-4 py-2.5 border border-hf-border text-hf-text font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="relative flex-1 px-4 py-2.5 bg-hf-gold text-hf-dark font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-gold-light disabled:opacity-40 transition-colors"
            >
              Import {selected.size} contact{selected.size !== 1 ? "s" : ""}
              <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-dark" />
            </button>
          </div>
        )}

        {/* Close button (when no results) */}
        {results.length === 0 && mode === "csv" && (
          <div className="mt-5">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border border-hf-border text-hf-text font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-hover transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
