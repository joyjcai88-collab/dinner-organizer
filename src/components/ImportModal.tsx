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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Import LinkedIn Contacts</h2>
        <p className="text-sm text-gray-500 mb-4">
          Export your connections from LinkedIn Settings &rarr; Data Privacy &rarr; Get a copy of your data
        </p>

        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm text-gray-600">Drop your CSV file here or click to browse</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        {preview.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Found {preview.length} contacts
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(roleCounts).map(([role, count]) => (
                <span
                  key={role}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {count} {role}s
                </span>
              ))}
            </div>
            <div className="max-h-40 overflow-y-auto text-sm text-gray-600 border rounded-lg p-3 space-y-1">
              {preview.slice(0, 10).map((c) => (
                <div key={c.id}>
                  {c.firstName} {c.lastName} — {c.title} at {c.company}
                </div>
              ))}
              {preview.length > 10 && (
                <div className="text-gray-400">...and {preview.length - 10} more</div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => { setPreview([]); setError(""); onClose(); }}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Import {preview.length > 0 ? `${preview.length} contacts` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
