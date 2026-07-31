"use client";

import { useMemo, useState } from "react";
import { Guest, Role, ROLE_LABELS } from "@/lib/types";
import { upsertGuest, deleteGuest, saveGuests, getGuests } from "@/lib/store";
import { exportGuestsCSV } from "@/lib/csv";
import GuestModal from "./GuestModal";
import ImportModal from "./ImportModal";
import LinkedInConnect from "./LinkedInConnect";
import {
  RoleBadge,
  StrengthBar,
  LastSeen,
  PrimaryButton,
  GhostButton,
  inputCls,
} from "./ui";

interface Props {
  guests: Guest[];
  onRefresh: () => void;
}

export default function GuestsView({ guests, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [modalGuest, setModalGuest] = useState<Guest | null>(null);
  const [adding, setAdding] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...guests].sort((a, b) => b.strength - a.strength);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.company.toLowerCase().includes(q) ||
          (g.notes ?? "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") result = result.filter((g) => g.role === roleFilter);
    return result;
  }, [guests, search, roleFilter]);

  const handleExport = () => {
    const csv = exportGuestsCSV(guests);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "be-my-guest-guests.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-end gap-4 mb-8 flex-wrap">
        <input
          type="text"
          placeholder="Search guests, companies, notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} w-full sm:w-72`}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
          className={`${inputCls} w-auto font-mono text-[10px] uppercase tracking-[0.08em] text-secondary`}
        >
          <option value="all">All roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}s
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <GhostButton onClick={() => setAdding(true)}>+ Add guest</GhostButton>
        <LinkedInConnect
          onImport={(imported) => {
            saveGuests([...getGuests(), ...imported]);
            onRefresh();
          }}
        />
        <PrimaryButton onClick={() => setImportOpen(true)}>
          Import CSV
        </PrimaryButton>
        {guests.length > 0 && <GhostButton onClick={handleExport}>Export</GhostButton>}
      </div>

      <div className="bg-card border border-line rounded-none overflow-x-auto">
        <table className="w-full text-[14.5px]">
          <thead>
            <tr className="bg-tile border-b border-line text-left">
              {["Guest", "Role", "Strength", "Dinners", "Last seen", "Table memory", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted font-normal whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr
                key={g.id}
                className="border-b border-line last:border-b-0 hover:bg-tile cursor-pointer transition-colors"
                onClick={() => setModalGuest(g)}
              >
                <td className="px-4 py-3">
                  <p className="font-serif text-[16px] text-text">{g.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-1">
                    {g.company}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={g.role} />
                </td>
                <td className="px-4 py-3">
                  <StrengthBar value={g.strength} />
                </td>
                <td className="px-4 py-3 font-mono text-[10.5px] text-secondary">
                  {g.hosted}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <LastSeen iso={g.lastSeen} />
                </td>
                <td className="px-4 py-3 text-secondary max-w-[280px] truncate">
                  {g.notes}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!confirm(`Remove ${g.name}?`)) return;
                      deleteGuest(g.id);
                      onRefresh();
                    }}
                    className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-danger transition-colors"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <p className="font-serif text-[20px] text-text">
                    No guests match
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-3">
                    Try a different search or role filter
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(adding || modalGuest) && (
        <GuestModal
          editing={modalGuest}
          onClose={() => {
            setAdding(false);
            setModalGuest(null);
          }}
          onSave={(g) => {
            upsertGuest(g);
            onRefresh();
          }}
        />
      )}
      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImport={(imported) => {
            saveGuests([...getGuests(), ...imported]);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
