"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Contact, ContactRole } from "@/lib/types";
import type { LinkedInProfile } from "@/lib/linkedin";

type Mode = "url" | "search" | "bulk" | "csv";

const ROLE_COLORS: Record<ContactRole, string> = {
  founder: "bg-purple-100 text-purple-800",
  engineer: "bg-blue-100 text-blue-800",
  vc: "bg-green-100 text-green-800",
  operator: "bg-amber-100 text-amber-800",
  other: "bg-gray-100 text-gray-800",
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-gray-900">Import from LinkedIn</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Pull contact details directly from LinkedIn profiles
        </p>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          {([
            ["url", "Profile URL"],
            ["search", "Name Search"],
            ["bulk", "Bulk Import"],
            ["csv", "CSV Guide"],
          ] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); reset(); }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                mode === m
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Profile URL mode */}
        {mode === "url" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Profile URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                onKeyDown={(e) => e.key === "Enter" && handleUrlLookup()}
              />
              <button
                onClick={handleUrlLookup}
                disabled={loading || !url.trim()}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                {loading ? "Fetching..." : "Lookup"}
              </button>
            </div>
          </div>
        )}

        {/* Name search mode */}
        {mode === "search" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g. Sarah Chen"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company <span className="text-gray-400 font-normal">(optional, improves accuracy)</span>
              </label>
              <input
                type="text"
                value={searchCompany}
                onChange={(e) => setSearchCompany(e.target.value)}
                placeholder="e.g. Stripe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchName.trim()}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {loading ? "Searching..." : "Find on LinkedIn"}
            </button>
          </div>
        )}

        {/* Bulk import mode */}
        {mode === "bulk" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Profile URLs <span className="text-gray-400 font-normal">(one per line)</span>
            </label>
            <textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              rows={6}
              placeholder={"https://linkedin.com/in/person1\nhttps://linkedin.com/in/person2\nhttps://linkedin.com/in/person3"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-mono text-sm"
            />
            <button
              onClick={handleBulk}
              disabled={loading || !bulkUrls.trim()}
              className="mt-3 w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {loading
                ? `Fetching... (${progress.done}/${progress.total})`
                : "Fetch All Profiles"}
            </button>
          </div>
        )}

        {/* CSV guide mode */}
        {mode === "csv" && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Export your LinkedIn connections</h3>
              <ol className="space-y-2.5 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Go to <strong>LinkedIn Settings</strong> &rarr; <strong>Data Privacy</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Click <strong>Get a copy of your data</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Select <strong>Connections</strong> and click <strong>Request archive</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Wait for the email (usually ~10 minutes), download the ZIP</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  <span>Extract and use <strong>Import CSV</strong> on the Contacts tab with the <code className="px-1 py-0.5 bg-gray-200 rounded text-xs">Connections.csv</code> file</span>
                </li>
              </ol>
            </div>
            <p className="text-xs text-gray-500">
              The CSV export includes name, company, position, and email for all your connections.
              Our importer auto-detects LinkedIn&apos;s format and assigns roles based on job titles.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading progress */}
        {loading && progress.total > 1 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Fetching profiles...</span>
              <span>{progress.done} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Found {results.length} profile{results.length > 1 ? "s" : ""}
              </h3>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setSelected(new Set(results.map((_, i) => i)))}
                  className="text-indigo-600 hover:underline"
                >
                  Select all
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-indigo-600 hover:underline"
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
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selected.has(i)
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleSelect(i)}
                    className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {p.firstName} {p.lastName}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[p.role]}`}>
                        {p.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {p.title || p.headline}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
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
              onClick={() => { reset(); onClose(); }}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Import {selected.size} contact{selected.size !== 1 ? "s" : ""}
            </button>
          </div>
        )}

        {/* Close button (when no results) */}
        {results.length === 0 && mode === "csv" && (
          <div className="mt-5">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
