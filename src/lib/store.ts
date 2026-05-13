import { Contact, DinnerEvent, RandomizationConfig } from "./types";

const CONTACTS_KEY = "dinner-organizer-contacts";
const EVENTS_KEY = "dinner-organizer-events";

function getFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getContacts(): Contact[] {
  return getFromStorage<Contact>(CONTACTS_KEY);
}

export function saveContacts(contacts: Contact[]) {
  saveToStorage(CONTACTS_KEY, contacts);
}

export function addContact(contact: Contact) {
  const contacts = getContacts();
  contacts.push(contact);
  saveContacts(contacts);
}

export function updateContact(updated: Contact) {
  const contacts = getContacts().map((c) =>
    c.id === updated.id ? updated : c
  );
  saveContacts(contacts);
}

export function deleteContact(id: string) {
  saveContacts(getContacts().filter((c) => c.id !== id));
}

export function getEvents(): DinnerEvent[] {
  return getFromStorage<DinnerEvent>(EVENTS_KEY);
}

export function saveEvents(events: DinnerEvent[]) {
  saveToStorage(EVENTS_KEY, events);
}

export function addEvent(event: DinnerEvent) {
  const events = getEvents();
  events.push(event);
  saveEvents(events);
}

export function updateEvent(updated: DinnerEvent) {
  const events = getEvents().map((e) =>
    e.id === updated.id ? updated : e
  );
  saveEvents(events);
}

export function deleteEvent(id: string) {
  saveEvents(getEvents().filter((e) => e.id !== id));
}

export function randomizeGuests(
  config: RandomizationConfig
): Contact[] {
  const contacts = getContacts();
  const events = getEvents();
  const now = new Date();

  let pool = contacts.filter(
    (c) => !config.excludeContactIds.includes(c.id)
  );

  if (config.excludeRecentAttendees) {
    const cutoff = new Date(
      now.getTime() - config.recentWindowDays * 24 * 60 * 60 * 1000
    );
    pool = pool.filter((c) => {
      if (!c.lastEventDate) return true;
      return new Date(c.lastEventDate) < cutoff;
    });
  }

  const selected: Contact[] = [];
  const roles = Object.entries(config.roleMix) as [string, number][];

  for (const [role, count] of roles) {
    let rolePool = pool.filter((c) => c.role === role);

    if (config.preferTags.length > 0) {
      rolePool.sort((a, b) => {
        const aMatch = a.tags.filter((t) =>
          config.preferTags.includes(t)
        ).length;
        const bMatch = b.tags.filter((t) =>
          config.preferTags.includes(t)
        ).length;
        return bMatch - aMatch;
      });
    }

    // Weighted random: favor those who attended fewer events
    rolePool.sort(() => Math.random() - 0.5);
    rolePool.sort((a, b) => a.eventsAttended - b.eventsAttended);

    const picked = rolePool.slice(0, count);
    selected.push(...picked);
    pool = pool.filter((c) => !picked.find((p) => p.id === c.id));
  }

  return selected;
}
