"use client";

import { DinnerEvent, Contact } from "@/lib/types";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-800",
};

interface Props {
  event: DinnerEvent;
  contacts: Contact[];
  onEdit: (event: DinnerEvent) => void;
  onDelete: (id: string) => void;
}

export default function EventCard({ event, contacts, onEdit, onDelete }: Props) {
  const guests = contacts.filter((c) => event.guests.includes(c.id));
  const roleCounts = guests.reduce(
    (acc, g) => {
      acc[g.role] = (acc[g.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{event.name}</h3>
          <p className="text-sm text-gray-500">{event.hostFirm}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[event.status]}`}>
          {event.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-400">Date</span>
          <p className="text-gray-700 font-medium">
            {event.date ? format(new Date(event.date + "T00:00:00"), "MMM d, yyyy") : "TBD"}
          </p>
        </div>
        <div>
          <span className="text-gray-400">Time</span>
          <p className="text-gray-700 font-medium">{event.time || "TBD"}</p>
        </div>
        <div>
          <span className="text-gray-400">Venue</span>
          <p className="text-gray-700 font-medium">{event.venue || "TBD"}</p>
        </div>
        <div>
          <span className="text-gray-400">Guests</span>
          <p className="text-gray-700 font-medium">
            {guests.length} / {event.capacity}
          </p>
        </div>
      </div>

      {guests.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Object.entries(roleCounts).map(([role, count]) => (
              <span
                key={role}
                className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
              >
                {count} {role}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {guests.slice(0, 8).map((g) => (
              <span
                key={g.id}
                className="inline-block px-2 py-1 text-xs rounded-lg bg-indigo-50 text-indigo-700"
              >
                {g.firstName} {g.lastName[0]}.
              </span>
            ))}
            {guests.length > 8 && (
              <span className="px-2 py-1 text-xs text-gray-400">
                +{guests.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onEdit(event)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(event.id)}
          className="text-sm text-red-400 hover:text-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
