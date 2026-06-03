"use client";

import { useState, useRef } from "react";
import { parseLinkedInCSV } from "@/lib/csv";
import { Contact } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (contacts: Contact[]) => void;
}

export default function ImportModal({ open, onClose, onImport }: Props) {
  const [preview, setPreview] = useState<Contact[]>([]);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = parseLinkedInCSV(text);
        if (parsed.length === 0) {
          setError("No contacts found in file. Check the CSV format.");
          return;
        }
        setPreview(parsed);
      } catch {
        setError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    onImport(preview);
    setPreview([]);
    onClose();
  };

  const roleCounts = preview.reduce(
    (acc, c) => {
      acc[c.role] = (acc[c.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-hf-border max-w-lg w-full p-8">
        <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-hf-text mb-1">
          Import LinkedIn Contacts
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-6">
          Export your connections from LinkedIn Settings &rarr; Data Privacy &rarr; Get a copy of
          your data
        </p>

        <div
          className="border-2 border-dashed border-hf-border p-8 text-center cursor-pointer hover:border-hf-gold transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm text-hf-muted">
            Drop your CSV file here or click to browse
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {preview.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-medium text-hf-text mb-2">
              Found {preview.length} contacts
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(roleCounts).map(([role, count]) => (
                <span
                  key={role}
                  className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider bg-hf-cream text-hf-muted"
                >
                  {count} {role}s
                </span>
              ))}
            </div>
            <div className="max-h-40 overflow-y-auto text-sm text-hf-muted border border-hf-border p-3 space-y-1">
              {preview.slice(0, 10).map((c) => (
                <div key={c.id}>
                  {c.firstName} {c.lastName} — {c.title} at {c.company}
                </div>
              ))}
              {preview.length > 10 && (
                <div className="text-hf-muted/60">
                  ...and {preview.length - 10} more
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => {
              setPreview([]);
              setError("");
              onClose();
            }}
            className="flex-1 px-4 py-2.5 border border-hf-border text-hf-text font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0}
            className="relative flex-1 px-4 py-2.5 bg-hf-gold text-hf-dark font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Import {preview.length > 0 ? `${preview.length} contacts` : ""}
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-dark" />
          </button>
        </div>
      </div>
    </div>
  );
}
