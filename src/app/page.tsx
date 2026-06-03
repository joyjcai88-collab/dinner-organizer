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
import LinkedInConnect from "@/components/LinkedInConnect";

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
    <div className="min-h-screen bg-hf-cream">
      {/* Dark header */}
      <header className="bg-hf-dark">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-dm-serif)] text-4xl text-white">
                Dinner Organizer
              </h1>
              <p className="text-sm text-hf-muted mt-2 font-mono uppercase tracking-widest">
                Founder & engineer dinners for VC ecosystem events
              </p>
            </div>
            <div className="flex items-center gap-6">
              <LinkedInConnect onImport={handleImport} />
              <div className="text-right">
                <p className="text-white font-mono text-sm uppercase tracking-wider">
                  {contacts.length} contacts
                </p>
                <p className="text-hf-muted font-mono text-xs uppercase tracking-wider mt-1">
                  {events.length} events
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto flex">
            <button
              onClick={() => setTab("contacts")}
              className={`flex-1 py-4 font-mono text-sm uppercase tracking-[0.2em] transition-colors border-r border-white/10 ${
                tab === "contacts"
                  ? "text-hf-gold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Contacts
            </button>
            <button
              onClick={() => setTab("events")}
              className={`flex-1 py-4 font-mono text-sm uppercase tracking-[0.2em] transition-colors ${
                tab === "events"
                  ? "text-hf-gold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Events
            </button>
          </div>
        </div>
      </header>

      {/* Role counts bar */}
      {contacts.length > 0 && (
        <div className="border-b border-hf-border">
          <div className="max-w-7xl mx-auto px-6 py-3 flex gap-6">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-hf-muted">
                  {role}
                </span>
                <span className="text-sm font-semibold text-hf-text">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-16">
        {tab === "contacts" && (
          <div>
            <div className="flex items-center gap-3 mb-8 flex-wrap">
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2.5 border border-hf-border rounded-none bg-white w-64 focus:ring-2 focus:ring-hf-gold focus:border-hf-gold text-hf-text placeholder:text-hf-muted text-sm"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as ContactRole | "all")}
                className="px-3 py-2.5 border border-hf-border rounded-none bg-white focus:ring-2 focus:ring-hf-gold text-hf-text font-mono text-xs uppercase tracking-wider"
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
                className="relative px-5 py-2.5 bg-white border border-hf-border text-hf-text font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-hover transition-colors"
              >
                + Add Contact
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="relative px-5 py-2.5 bg-hf-gold text-hf-dark font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-gold-light transition-colors"
              >
                Import CSV
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-dark" />
              </button>
              {contacts.length > 0 && (
                <button
                  onClick={handleExport}
                  className="px-5 py-2.5 bg-white border border-hf-border text-hf-text font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-hover transition-colors"
                >
                  Export
                </button>
              )}
            </div>

            <div className="bg-white border border-hf-border p-6">
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
            <div className="flex items-center justify-between mb-8">
              <p className="font-mono text-xs uppercase tracking-widest text-hf-muted">
                {events.length === 0
                  ? "No events yet — create one to get started"
                  : `${events.length} event${events.length === 1 ? "" : "s"}`}
              </p>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setCreateEventOpen(true);
                }}
                className="relative px-5 py-2.5 bg-hf-gold text-hf-dark font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-gold-light transition-colors"
              >
                + Create Event
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-dark" />
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-20 bg-white border border-hf-border">
                <div className="text-5xl mb-4">🍽️</div>
                <p className="font-[family-name:var(--font-dm-serif)] text-2xl text-hf-text">
                  No dinner events yet
                </p>
                <p className="text-sm mt-2 text-hf-muted">
                  Create an event and randomize your guest list from your contacts
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
