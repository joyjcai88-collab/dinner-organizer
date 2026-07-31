"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Guest } from "@/lib/types";
import type { LinkedInProfile } from "@/lib/linkedin";
import { Modal, PrimaryButton, GhostButton, RoleBadge, inputCls, labelCls } from "./ui";

type Mode = "url" | "search" | "bulk";

const MODES: [Mode, string][] = [
  ["url", "Profile URL"],
  ["search", "Name search"],
  ["bulk", "Bulk import"],
];

function profileToGuest(p: LinkedInProfile): Guest {
  const title = p.title || p.headline;
  const extra = [p.headline && p.headline !== title ? p.headline : null, p.location]
    .filter(Boolean)
    .join(" · ");
  const notes = p.summary?.trim() ? p.summary.slice(0, 200) : extra || null;

  return {
    id: uuid(),
    name: p.name,
    role: p.role,
    company: p.company,
    title,
    email: "",
    linkedinUrl: p.profileUrl,
    sector: null,
    stage: null,
    strength: 1,
    socialEnergy: "medium",
    hosted: 0,
    lastSeen: null,
    notes,
    createdAt: new Date().toISOString(),
  };
}

export interface LinkedInOAuthProfile {
  name: string;
  firstName: string;
  picture: string;
}

interface Props {
  profile: LinkedInOAuthProfile | null;
  connectState: "idle" | "checking" | "not_configured";
  onConnect: () => void;
  onDisconnect: () => void;
  onClose: () => void;
  onImport: (guests: Guest[]) => void;
}

export default function LinkedInImport({
  profile,
  connectState,
  onConnect,
  onDisconnect,
  onClose,
  onImport,
}: Props) {
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
    const guests = results.filter((_, i) => selected.has(i)).map(profileToGuest);
    onImport(guests);
  };

  const tabCls = (active: boolean) =>
    `flex-1 rounded-full py-[11px] font-mono text-[10.5px] uppercase tracking-[0.08em] transition-colors ${
      active ? "bg-ink text-paper" : "bg-pill text-secondary hover:bg-pill-hi"
    }`;

  return (
    <Modal
      title="Import from LinkedIn"
      subtitle="Pull contact details directly from a LinkedIn profile"
      onClose={onClose}
      wide
    >
      {/* OAuth connect row */}
      <div className="flex items-center justify-between border border-line rounded-none px-4 py-3 mb-6">
        {profile ? (
          <>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-secondary">
              Connected as {profile.firstName}
            </span>
            <button
              onClick={onDisconnect}
              className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-danger transition-colors"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              {connectState === "not_configured"
                ? "LinkedIn sign-in isn't configured. Set LINKEDIN_CLIENT_ID to enable"
                : "Not connected. Sign-in is optional, lookups below work either way"}
            </span>
            {connectState !== "not_configured" && (
              <button
                onClick={onConnect}
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-secondary hover:text-accent transition-colors shrink-0 ml-3"
              >
                {connectState === "checking" ? "Checking…" : "Connect LinkedIn"}
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {MODES.map(([m, label]) => (
          <button
            key={m}
            className={tabCls(mode === m)}
            onClick={() => {
              setMode(m);
              reset();
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "url" && (
        <div>
          <label className={labelCls}>LinkedIn profile URL</label>
          <div className="flex items-end gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://linkedin.com/in/johndoe"
              className={`flex-1 ${inputCls}`}
              onKeyDown={(e) => e.key === "Enter" && handleUrlLookup()}
            />
            <div className="shrink-0">
              <GhostButton onClick={handleUrlLookup}>
                {loading ? "Fetching…" : "Lookup"}
              </GhostButton>
            </div>
          </div>
        </div>
      )}

      {mode === "search" && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label className={labelCls}>Name</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g. Sarah Chen"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Company (optional)</label>
            <input
              type="text"
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              placeholder="e.g. Stripe"
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <GhostButton onClick={handleSearch}>
              {loading ? "Searching…" : "Find on LinkedIn"}
            </GhostButton>
          </div>
        </div>
      )}

      {mode === "bulk" && (
        <div>
          <label className={labelCls}>LinkedIn profile URLs, one per line</label>
          <textarea
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
            rows={5}
            placeholder={
              "https://linkedin.com/in/person1\nhttps://linkedin.com/in/person2\nhttps://linkedin.com/in/person3"
            }
            className={`${inputCls} font-mono text-[13px]`}
          />
          <div className="mt-3">
            <GhostButton onClick={handleBulk}>
              {loading
                ? `Fetching… (${progress.done}/${progress.total})`
                : "Fetch all profiles"}
            </GhostButton>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-danger">
          {error}
        </p>
      )}

      {loading && progress.total > 1 && (
        <div className="mt-4">
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-1.5">
            <span>Fetching profiles</span>
            <span>
              {progress.done} / {progress.total}
            </span>
          </div>
          <span className="block w-full h-[2px] bg-[#dcdcdc]">
            <span
              className="block h-full bg-accent transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </span>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              Found {results.length} profile{results.length > 1 ? "s" : ""}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setSelected(new Set(results.map((_, i) => i)))}
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-secondary hover:text-accent transition-colors"
              >
                Select all
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-secondary hover:text-accent transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="border border-line rounded-none max-h-64 overflow-y-auto divide-y divide-line">
            {results.map((p, i) => (
              <div
                key={i}
                onClick={() => toggleSelect(i)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  selected.has(i) ? "bg-tile" : "hover:bg-tile"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                  className="mt-1.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="font-serif text-[16px] text-text truncate">{p.name}</p>
                    <RoleBadge role={p.role} />
                  </div>
                  <p className="text-[14.5px] text-secondary truncate mt-0.5">
                    {p.title || p.headline}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted truncate mt-1">
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

      <div className="flex gap-3 mt-10">
        <div className="flex-1">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
        <PrimaryButton disabled={selected.size === 0} onClick={handleImport}>
          Import{selected.size > 0 ? ` ${selected.size} guest${selected.size !== 1 ? "s" : ""}` : ""}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
