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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {editing ? "Edit Event" : "Create Dinner Event"}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q2 Founder Dinner"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host Firm</label>
            <input
              type="text"
              value={hostFirm}
              onChange={(e) => setHostFirm(e.target.value)}
              placeholder="e.g. Sequoia Capital"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. The Battery SF"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 10)}
              min={2}
              max={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Role Mix <span className="font-normal text-gray-400">({totalMix} seats allocated)</span>
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {(Object.keys(roleMix) as Array<keyof RoleMix>).map((role) => (
              <div key={role}>
                <label className="block text-xs text-gray-500 capitalize mb-1">{role}</label>
                <input
                  type="number"
                  value={roleMix[role]}
                  onChange={(e) =>
                    setRoleMix({ ...roleMix, [role]: parseInt(e.target.value) || 0 })
                  }
                  min={0}
                  max={capacity}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-indigo-900">Randomize Guest List</h3>
            <button
              onClick={handleRandomize}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🎲 Randomize
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-indigo-800 mb-2">
            <input
              type="checkbox"
              checked={excludeRecent}
              onChange={(e) => setExcludeRecent(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600"
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
              className="w-full accent-indigo-600"
            />
          )}
        </div>

        {guestContacts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Guest List ({guestContacts.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {guestContacts.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Dietary restrictions, theme, talking points..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            {editing ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
}
