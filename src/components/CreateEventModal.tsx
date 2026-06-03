"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { DinnerEvent, RoleMix, Contact } from "@/lib/types";
import { randomizeGuests, getContacts } from "@/lib/store";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (event: DinnerEvent) => void;
  editing?: DinnerEvent | null;
  allContacts: Contact[];
}

const DEFAULT_MIX: RoleMix = { founder: 4, engineer: 3, vc: 2, operator: 1, other: 0 };

export default function CreateEventModal({ open, onClose, onSave, editing, allContacts }: Props) {
  const [name, setName] = useState(editing?.name || "");
  const [date, setDate] = useState(editing?.date || "");
  const [time, setTime] = useState(editing?.time || "19:00");
  const [venue, setVenue] = useState(editing?.venue || "");
  const [hostFirm, setHostFirm] = useState(editing?.hostFirm || "");
  const [capacity, setCapacity] = useState(editing?.capacity || 10);
  const [roleMix, setRoleMix] = useState<RoleMix>(editing?.roleMix || DEFAULT_MIX);
  const [guests, setGuests] = useState<string[]>(editing?.guests || []);
  const [excludeRecent, setExcludeRecent] = useState(true);
  const [recentDays, setRecentDays] = useState(30);
  const [notes, setNotes] = useState(editing?.notes || "");

  if (!open) return null;

  const totalMix = Object.values(roleMix).reduce((a, b) => a + b, 0);

  const handleRandomize = () => {
    const selected = randomizeGuests({
      capacity,
      roleMix,
      excludeRecentAttendees: excludeRecent,
      recentWindowDays: recentDays,
      excludeContactIds: [],
      preferTags: [],
    });
    setGuests(selected.map((c) => c.id));
  };

  const handleSave = () => {
    const event: DinnerEvent = {
      id: editing?.id || uuid(),
      name: name || "Untitled Dinner",
      date,
      time,
      venue,
      hostFirm,
      capacity,
      guests,
      status: editing?.status || "draft",
      roleMix,
      notes,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    onSave(event);
    onClose();
  };

  const guestContacts = allContacts.filter((c) => guests.includes(c.id));

  const inputClass =
    "w-full px-3 py-2.5 border border-hf-border rounded-none bg-white focus:ring-2 focus:ring-hf-gold focus:border-hf-gold text-hf-text text-sm";
  const labelClass =
    "block font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-hf-border max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-hf-text mb-1">
          {editing ? "Edit Event" : "Create Dinner Event"}
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-6">
          {editing ? "Update event details" : "Set up a new dinner"}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="col-span-2">
            <label className={labelClass}>Event Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q2 Founder Dinner"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Host Firm</label>
            <input
              type="text"
              value={hostFirm}
              onChange={(e) => setHostFirm(e.target.value)}
              placeholder="e.g. Sequoia Capital"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Venue</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. The Battery SF"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 10)}
              min={2}
              max={50}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-3">
            Role Mix{" "}
            <span className="text-hf-muted/60">({totalMix} seats allocated)</span>
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {(Object.keys(roleMix) as Array<keyof RoleMix>).map((role) => (
              <div key={role}>
                <label className="block text-xs text-hf-muted capitalize mb-1">
                  {role}
                </label>
                <input
                  type="number"
                  value={roleMix[role]}
                  onChange={(e) =>
                    setRoleMix({ ...roleMix, [role]: parseInt(e.target.value) || 0 })
                  }
                  min={0}
                  max={capacity}
                  className="w-full px-2 py-1.5 border border-hf-border rounded-none text-sm focus:ring-2 focus:ring-hf-gold text-hf-text"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 p-5 bg-hf-dark text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-xs uppercase tracking-[0.15em]">
              Randomize Guest List
            </h3>
            <button
              onClick={handleRandomize}
              className="relative px-4 py-1.5 bg-hf-gold text-hf-dark font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-gold-light transition-colors"
            >
              🎲 Randomize
              <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-white" />
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/80 mb-2">
            <input
              type="checkbox"
              checked={excludeRecent}
              onChange={(e) => setExcludeRecent(e.target.checked)}
              className="rounded-none border-white/30 text-hf-gold accent-hf-gold"
            />
            Exclude recent attendees (last {recentDays} days)
          </label>
          {excludeRecent && (
            <input
              type="range"
              min={7}
              max={90}
              value={recentDays}
              onChange={(e) => setRecentDays(parseInt(e.target.value))}
              className="w-full accent-hf-gold"
            />
          )}
        </div>

        {guestContacts.length > 0 && (
          <div className="mb-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-2">
              Guest List ({guestContacts.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {guestContacts.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-hf-gold/20 text-hf-dark"
                >
                  {g.firstName} {g.lastName}
                  <button
                    onClick={() => setGuests(guests.filter((id) => id !== g.id))}
                    className="ml-0.5 hover:text-red-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className={labelClass}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Dietary restrictions, theme, talking points..."
            className={inputClass}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-hf-border text-hf-text font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="relative flex-1 px-4 py-2.5 bg-hf-dark text-white font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-dark/90 transition-colors"
          >
            {editing ? "Save Changes" : "Create Event"}
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-gold" />
          </button>
        </div>
      </div>
    </div>
  );
}
