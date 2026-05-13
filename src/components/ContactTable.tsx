"use client";

import { Contact, ContactRole } from "@/lib/types";
import { deleteContact } from "@/lib/store";

const ROLE_COLORS: Record<ContactRole, string> = {
  founder: "bg-purple-100 text-purple-800",
  engineer: "bg-blue-100 text-blue-800",
  vc: "bg-green-100 text-green-800",
  operator: "bg-amber-100 text-amber-800",
  other: "bg-gray-100 text-gray-800",
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
      <div className="text-center py-16 text-gray-500">
        <div className="text-5xl mb-4">📇</div>
        <p className="text-lg">No contacts yet</p>
        <p className="text-sm mt-1">Import a LinkedIn CSV or add contacts manually</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
        <span>{selectedIds.size} selected</span>
        <button onClick={onSelectAll} className="text-indigo-600 hover:underline">
          Select all
        </button>
        <button onClick={onClearSelection} className="text-indigo-600 hover:underline">
          Clear
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500 uppercase text-xs tracking-wider">
            <th className="pb-3 pr-3 w-8"></th>
            <th className="pb-3 pr-3">Name</th>
            <th className="pb-3 pr-3">Role</th>
            <th className="pb-3 pr-3">Company</th>
            <th className="pb-3 pr-3">Title</th>
            <th className="pb-3 pr-3">Events</th>
            <th className="pb-3 pr-3 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => onToggleSelect(c.id)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </td>
              <td className="py-3 pr-3 font-medium text-gray-900">
                {c.firstName} {c.lastName}
              </td>
              <td className="py-3 pr-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[c.role]}`}>
                  {c.role}
                </span>
              </td>
              <td className="py-3 pr-3 text-gray-600">{c.company}</td>
              <td className="py-3 pr-3 text-gray-600 max-w-[200px] truncate">{c.title}</td>
              <td className="py-3 pr-3 text-gray-500">{c.eventsAttended}</td>
              <td className="py-3">
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
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
