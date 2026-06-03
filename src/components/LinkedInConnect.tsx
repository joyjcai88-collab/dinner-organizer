"use client";

import { useState, useEffect, useRef } from "react";
import { parseLinkedInCSV } from "@/lib/csv";
import { Contact } from "@/lib/types";

interface LinkedInProfile {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  picture: string;
  sub: string;
}

interface Props {
  onImport: (contacts: Contact[]) => void;
}

export default function LinkedInConnect({ onImport }: Props) {
  const [profile, setProfile] = useState<LinkedInProfile | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState<Contact[]>([]);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("linkedin_profile="));
    if (cookie) {
      try {
        const data = JSON.parse(decodeURIComponent(cookie.split("=").slice(1).join("=")));
        setProfile(data);
      } catch {}
    }
  }, []);

  const handleConnect = () => {
    window.location.href = "/api/auth/linkedin";
  };

  const handleDisconnect = () => {
    document.cookie = "linkedin_profile=; Path=/; Max-Age=0";
    setProfile(null);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = parseLinkedInCSV(text);
        if (parsed.length === 0) {
          setError("No contacts found. Make sure this is a LinkedIn Connections.csv file.");
          return;
        }
        setPreview(parsed);
        setStep(3);
      } catch {
        setError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    onImport(preview);
    setPreview([]);
    setShowWizard(false);
    setStep(1);
  };

  const roleCounts = preview.reduce(
    (acc, c) => {
      acc[c.role] = (acc[c.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <>
      {/* Connect / Connected button */}
      {profile ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-hf-border">
            {profile.picture && (
              <img
                src={profile.picture}
                alt=""
                className="w-5 h-5 rounded-full"
              />
            )}
            <span className="font-mono text-[10px] uppercase tracking-wider text-hf-text">
              {profile.firstName}
            </span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="relative px-5 py-2.5 bg-hf-gold text-hf-dark font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-gold-light transition-colors"
          >
            Import Contacts
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-dark" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="relative px-5 py-2.5 bg-[#0A66C2] text-white font-mono text-xs uppercase tracking-[0.15em] hover:bg-[#004182] transition-colors"
        >
          Connect LinkedIn
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-gold" />
        </button>
      )}

      {/* Import Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-hf-border max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-hf-text">
                Import LinkedIn Contacts
              </h2>
              <button
                onClick={() => {
                  setShowWizard(false);
                  setStep(1);
                  setPreview([]);
                  setError("");
                }}
                className="text-hf-muted hover:text-hf-dark text-xl"
              >
                &times;
              </button>
            </div>

            {profile && (
              <div className="flex items-center gap-2 mb-6">
                {profile.picture && (
                  <img src={profile.picture} alt="" className="w-5 h-5 rounded-full" />
                )}
                <span className="text-sm text-hf-muted">
                  Connected as {profile.name}
                </span>
                <button
                  onClick={handleDisconnect}
                  className="font-mono text-[10px] uppercase tracking-wider text-hf-muted hover:text-red-600 ml-2"
                >
                  Disconnect
                </button>
              </div>
            )}

            {/* Progress steps */}
            <div className="flex items-center gap-0 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-7 h-7 flex items-center justify-center font-mono text-xs ${
                      step >= s
                        ? "bg-hf-dark text-white"
                        : "bg-hf-hover text-hf-muted"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-px ${
                        step > s ? "bg-hf-dark" : "bg-hf-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Export from LinkedIn */}
            {step === 1 && (
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-4">
                  Step 1: Export your connections
                </h3>
                <div className="bg-hf-cream p-5 mb-4">
                  <ol className="space-y-3 text-sm text-hf-text">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-hf-dark text-white flex items-center justify-center font-mono text-[10px]">
                        1
                      </span>
                      <span>
                        Click the button below to open LinkedIn&apos;s data export page
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-hf-dark text-white flex items-center justify-center font-mono text-[10px]">
                        2
                      </span>
                      <span>
                        Select <strong>&quot;Connections&quot;</strong> and click{" "}
                        <strong>&quot;Request archive&quot;</strong>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-hf-dark text-white flex items-center justify-center font-mono text-[10px]">
                        3
                      </span>
                      <span>
                        Wait for the email from LinkedIn (~10 min), then download the ZIP
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-hf-dark text-white flex items-center justify-center font-mono text-[10px]">
                        4
                      </span>
                      <span>
                        Extract the ZIP and find <code className="px-1 py-0.5 bg-hf-dark/10 font-mono text-xs">Connections.csv</code>
                      </span>
                    </li>
                  </ol>
                </div>
                <a
                  href="https://www.linkedin.com/mypreferences/d/download-my-data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-block px-5 py-2.5 bg-[#0A66C2] text-white font-mono text-xs uppercase tracking-[0.15em] hover:bg-[#004182] transition-colors mb-4"
                >
                  Open LinkedIn Data Export
                  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-gold" />
                </a>
                <p className="text-xs text-hf-muted mb-6">
                  Already have your Connections.csv? Skip to the next step.
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="relative w-full px-4 py-2.5 bg-hf-dark text-white font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-dark/90 transition-colors"
                >
                  I have my CSV file &rarr;
                  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-gold" />
                </button>
              </div>
            )}

            {/* Step 2: Upload CSV */}
            {step === 2 && (
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-4">
                  Step 2: Upload your Connections.csv
                </h3>
                <div
                  className={`border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-hf-gold bg-hf-gold/10"
                      : "border-hf-border hover:border-hf-gold"
                  }`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="text-4xl mb-3">📂</div>
                  <p className="text-sm text-hf-text font-medium mb-1">
                    Drop your Connections.csv here
                  </p>
                  <p className="text-xs text-hf-muted">or click to browse</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
                {error && (
                  <p className="mt-3 text-sm text-red-600">{error}</p>
                )}
                <button
                  onClick={() => setStep(1)}
                  className="mt-4 font-mono text-[10px] uppercase tracking-wider text-hf-muted hover:text-hf-dark transition-colors"
                >
                  &larr; Back
                </button>
              </div>
            )}

            {/* Step 3: Review & Import */}
            {step === 3 && (
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-4">
                  Step 3: Review & import
                </h3>
                <div className="bg-hf-cream p-4 mb-4">
                  <p className="font-[family-name:var(--font-dm-serif)] text-xl text-hf-text mb-3">
                    {preview.length} contacts found
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(roleCounts).map(([role, count]) => (
                      <span
                        key={role}
                        className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider bg-white text-hf-muted border border-hf-border"
                      >
                        {count} {role}s
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-hf-muted">
                    Roles are auto-assigned based on job titles. You can change them after import.
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto text-sm text-hf-muted border border-hf-border p-3 space-y-1 mb-4">
                  {preview.slice(0, 15).map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="text-hf-text font-medium">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="text-hf-muted/60">
                        {c.title ? `${c.title} at ` : ""}
                        {c.company}
                      </span>
                    </div>
                  ))}
                  {preview.length > 15 && (
                    <div className="text-hf-muted/60 pt-1">
                      ...and {preview.length - 15} more
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep(2);
                      setPreview([]);
                    }}
                    className="flex-1 px-4 py-2.5 border border-hf-border text-hf-text font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-hover transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    className="relative flex-1 px-4 py-2.5 bg-hf-gold text-hf-dark font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-gold-light transition-colors"
                  >
                    Import {preview.length} Contacts
                    <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-dark" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
