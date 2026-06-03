"use client";

import { DinnerEvent, Contact } from "@/lib/types";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-hf-gold/20 text-hf-dark",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-hf-hover text-hf-muted",
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
    <div className="border border-hf-border bg-white hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-[family-name:var(--font-dm-serif)] text-xl text-hf-text">
              {event.name}
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mt-1">
              {event.hostFirm}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_STYLES[event.status]}`}
          >
            {event.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-5">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted block mb-0.5">
              Date
            </span>
            <p className="text-hf-text font-medium">
              {event.date ? format(new Date(event.date + "T00:00:00"), "MMM d, yyyy") : "TBD"}
            </p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted block mb-0.5">
              Time
            </span>
            <p className="text-hf-text font-medium">{event.time || "TBD"}</p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted block mb-0.5">
              Venue
            </span>
            <p className="text-hf-text font-medium">{event.venue || "TBD"}</p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted block mb-0.5">
              Guests
            </span>
            <p className="text-hf-text font-medium">
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
                  className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider bg-hf-cream text-hf-muted"
                >
                  {count} {role}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {guests.slice(0, 8).map((g) => (
                <span
                  key={g.id}
                  className="inline-block px-2 py-1 text-xs bg-hf-gold/15 text-hf-dark"
                >
                  {g.firstName} {g.lastName[0]}.
                </span>
              ))}
              {guests.length > 8 && (
                <span className="px-2 py-1 text-xs text-hf-muted">
                  +{guests.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex border-t border-hf-border">
        <button
          onClick={() => onEdit(event)}
          className="flex-1 py-3 font-mono text-xs uppercase tracking-[0.15em] text-hf-dark hover:bg-hf-cream transition-colors border-r border-hf-border"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(event.id)}
          className="flex-1 py-3 font-mono text-xs uppercase tracking-[0.15em] text-hf-muted hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
