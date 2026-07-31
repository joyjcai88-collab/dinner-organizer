"use client";

import { useState, useRef } from "react";
import { parseLinkedInCSV } from "@/lib/csv";
import { Guest } from "@/lib/types";
import { Modal, PrimaryButton, GhostButton } from "./ui";

interface Props {
  onClose: () => void;
  onImport: (guests: Guest[]) => void;
}

export default function ImportModal({ onClose, onImport }: Props) {
  const [preview, setPreview] = useState<Guest[]>([]);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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

  const roleCounts = preview.reduce(
    (acc, g) => {
      acc[g.role] = (acc[g.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Modal
      title="Import LinkedIn CSV"
      subtitle="LinkedIn Settings → Data Privacy → Get a copy of your data → Connections"
      onClose={onClose}
    >
      <div
        className="border border-dashed border-line rounded-none p-10 text-center cursor-pointer hover:border-accent transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <p className="font-serif text-[18px] text-text">
          Drop the Connections.csv here or click to browse
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-danger">
          {error}
        </p>
      )}

      {preview.length > 0 && (
        <div className="mt-6">
          <p className="font-serif text-[18px] text-text mb-3">
            Found {preview.length} contacts
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(roleCounts).map(([role, count]) => (
              <span
                key={role}
                className="rounded-full px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] bg-tile text-secondary"
              >
                {count} {role}
              </span>
            ))}
          </div>
          <div className="max-h-40 overflow-y-auto text-[14.5px] text-secondary border border-line rounded-none p-4 space-y-1.5">
            {preview.slice(0, 10).map((g) => (
              <div key={g.id}>
                {g.name} · {g.title || g.role} at {g.company}
              </div>
            ))}
            {preview.length > 10 && (
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted pt-1">
                …and {preview.length - 10} more
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-10">
        <div className="flex-1">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
        <PrimaryButton
          disabled={preview.length === 0}
          onClick={() => {
            onImport(preview);
            onClose();
          }}
        >
          Import{preview.length > 0 ? ` ${preview.length} guests` : ""}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
