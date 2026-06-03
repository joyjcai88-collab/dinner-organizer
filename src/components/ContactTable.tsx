"use client";

import { Contact, ContactRole } from "@/lib/types";
import { deleteContact } from "@/lib/store";

const ROLE_COLORS: Record<ContactRole, string> = {
  founder: "bg-hf-gold/20 text-hf-dark",
  engineer: "bg-hf-dark/10 text-hf-dark",
  vc: "bg-hf-gold/40 text-hf-dark",
  operator: "bg-hf-cream text-hf-dark border border-hf-border",
  other: "bg-hf-hover text-hf-muted",
};

interface Props {
  contacts: Contact[];
  onRefresh: () => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export default function ContactTable({
  contacts,
  onRefresh,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
}: Props) {
  const handleDelete = (id: string) => {
    deleteContact(id);
    onRefresh();
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📇</div>
        <p className="font-[family-name:var(--font-dm-serif)] text-xl text-hf-text">
          No contacts yet
        </p>
        <p className="text-sm mt-2 text-hf-muted">
          Import a LinkedIn CSV or add contacts manually
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-4 mb-4 font-mono text-xs uppercase tracking-widest text-hf-muted">
        <span>{selectedIds.size} selected</span>
        <button onClick={onSelectAll} className="text-hf-dark hover:text-hf-gold transition-colors">
          Select all
        </button>
        <button onClick={onClearSelection} className="text-hf-dark hover:text-hf-gold transition-colors">
          Clear
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hf-border text-left">
            <th className="pb-3 pr-3 w-8"></th>
            <th className="pb-3 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted font-normal">
              Name
            </th>
            <th className="pb-3 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted font-normal">
              Role
            </th>
            <th className="pb-3 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted font-normal">
              Company
            </th>
            <th className="pb-3 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted font-normal">
              Title
            </th>
            <th className="pb-3 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted font-normal">
              Events
            </th>
            <th className="pb-3 pr-3 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr
              key={c.id}
              className="border-b border-hf-border/50 hover:bg-hf-cream/50 transition-colors"
            >
              <td className="py-3 pr-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => onToggleSelect(c.id)}
                  className="rounded-none border-hf-border text-hf-dark focus:ring-hf-gold accent-hf-gold"
                />
              </td>
              <td className="py-3 pr-3 font-medium text-hf-text">
                {c.firstName} {c.lastName}
              </td>
              <td className="py-3 pr-3">
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${ROLE_COLORS[c.role]}`}
                >
                  {c.role}
                </span>
              </td>
              <td className="py-3 pr-3 text-hf-muted">{c.company}</td>
              <td className="py-3 pr-3 text-hf-muted max-w-[200px] truncate">
                {c.title}
              </td>
              <td className="py-3 pr-3 text-hf-muted">{c.eventsAttended}</td>
              <td className="py-3">
                <button
                  onClick={() => handleDelete(c.id)}
                  className="font-mono text-[10px] uppercase tracking-wider text-hf-muted hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
