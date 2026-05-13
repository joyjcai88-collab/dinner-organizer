"use client";

import { useState, useEffect, useMemo } from "react";
import { Contact, DinnerEvent, ContactRole } from "@/lib/types";
import {
  getContacts,
  saveContacts,
  addContact as storeAddContact,
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/store";
import { exportContactsCSV } from "@/lib/csv";
import ContactTable from "@/components/ContactTable";
import ImportModal from "@/components/ImportModal";
import AddContactModal from "@/components/AddContactModal";
import CreateEventModal from "@/components/CreateEventModal";
import EventCard from "@/components/EventCard";
import LinkedInImport from "@/components/LinkedInImport";

type Tab = "contacts" | "events";

export default function Home() {
  const [tab, setTab] = useState<Tab>("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<DinnerEvent[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [linkedinOpen, setLinkedinOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DinnerEvent | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<ContactRole | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const refresh = () => {
    setContacts(getContacts());
    setEvents(getEvents());
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredContacts = useMemo(() => {
    let result = contacts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((c) => c.role === roleFilter);
    }
    return result;
  }, [contacts, search, roleFilter]);

  const handleImport = (imported: Contact[]) => {
    const existing = getContacts();
    saveContacts([...existing, ...imported]);
    refresh();
  };

  const handleAddContact = (contact: Contact) => {
    storeAddContact(contact);
    refresh();
  };

  const handleSaveEvent = (event: DinnerEvent) => {
    const existing = getEvents();
    if (existing.find((e) => e.id === event.id)) {
      updateEvent(event);
    } else {
      addEvent(event);
    }
    refresh();
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    refresh();
  };

  const handleExport = () => {
    const csv = exportContactsCSV(contacts);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dinner-contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach((c) => {
      counts[c.role] = (counts[c.role] || 0) + 1;
    });
    return counts;
  }, [contacts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dinner Organizer</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Founder & engineer dinners for VC ecosystem events
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <p className="font-medium text-gray-900">{contacts.length} contacts</p>
                <p className="text-gray-500">{events.length} events</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {contacts.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-3 flex gap-4">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div
                key={role}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg"
              >
                <span className="text-xs text-gray-500 capitalize">{role}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          <button
            onClick={() => setTab("contacts")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "contacts"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Contacts
          </button>
          <button
            onClick={() => setTab("events")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "events"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Events
          </button>
        </div>

        {tab === "contacts" && (
          <div>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as ContactRole | "all")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              >
                <option value="all">All roles</option>
                <option value="founder">Founders</option>
                <option value="engineer">Engineers</option>
                <option value="vc">VCs</option>
                <option value="operator">Operators</option>
                <option value="other">Other</option>
              </select>
              <div className="flex-1" />
              <button
                onClick={() => setAddContactOpen(true)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                + Add Contact
              </button>
              <button
                onClick={() => setLinkedinOpen(true)}
                className="px-4 py-2 bg-[#0A66C2] text-white rounded-lg text-sm font-medium hover:bg-[#004182] transition-colors"
              >
                LinkedIn Import
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Import CSV
              </button>
              {contacts.length > 0 && (
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Export
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <ContactTable
                contacts={filteredContacts}
                onRefresh={refresh}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={() =>
                  setSelectedIds(new Set(filteredContacts.map((c) => c.id)))
                }
                onClearSelection={() => setSelectedIds(new Set())}
              />
            </div>
          </div>
        )}

        {tab === "events" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {events.length === 0
                  ? "No events yet — create one to get started"
                  : `${events.length} event${events.length === 1 ? "" : "s"}`}
              </p>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setCreateEventOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + Create Event
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200">
                <div className="text-5xl mb-4">🍽️</div>
                <p className="text-lg">No dinner events yet</p>
                <p className="text-sm mt-1">
                  Create an event and randomize your guest list from your contacts
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    contacts={contacts}
                    onEdit={(e) => {
                      setEditingEvent(e);
                      setCreateEventOpen(true);
                    }}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <LinkedInImport
        open={linkedinOpen}
        onClose={() => setLinkedinOpen(false)}
        onImport={handleImport}
      />
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
      <AddContactModal
        open={addContactOpen}
        onClose={() => setAddContactOpen(false)}
        onSave={handleAddContact}
      />
      <CreateEventModal
        open={createEventOpen}
        onClose={() => {
          setCreateEventOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        editing={editingEvent}
        allContacts={contacts}
      />
    </div>
  );
}
