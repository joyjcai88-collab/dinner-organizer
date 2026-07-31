import { Guest, Intro, Table } from "./types";
import { DEMO_GUESTS, DEMO_TABLES, DEMO_INTROS } from "./demo-data";

const GUESTS_KEY = "covers-guests";
const TABLES_KEY = "covers-tables";
const INTROS_KEY = "covers-intros";
const DEMO_KEY = "covers-demo-mode";

function read<T>(key: string): T[] | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(key);
  return data ? (JSON.parse(data) as T[]) : null;
}

function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_KEY) === "1";
}

export function seedDemo() {
  write(GUESTS_KEY, DEMO_GUESTS);
  write(TABLES_KEY, DEMO_TABLES);
  write(INTROS_KEY, DEMO_INTROS);
  localStorage.setItem(DEMO_KEY, "1");
}

export function clearAll() {
  write(GUESTS_KEY, []);
  write(TABLES_KEY, []);
  write(INTROS_KEY, []);
  localStorage.removeItem(DEMO_KEY);
}

/** First visit: no data at all → load the demo so nobody lands on an empty state. */
export function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (read<Guest>(GUESTS_KEY) === null && read<Table>(TABLES_KEY) === null) {
    seedDemo();
  }
}

export function getGuests(): Guest[] {
  return read<Guest>(GUESTS_KEY) ?? [];
}

export function saveGuests(guests: Guest[]) {
  write(GUESTS_KEY, guests);
}

export function upsertGuest(guest: Guest) {
  const guests = getGuests();
  const i = guests.findIndex((g) => g.id === guest.id);
  if (i >= 0) guests[i] = guest;
  else guests.push(guest);
  saveGuests(guests);
}

export function deleteGuest(id: string) {
  saveGuests(getGuests().filter((g) => g.id !== id));
  // scrub from tables and intros so nothing dangles
  saveTables(
    getTables().map((t) => ({
      ...t,
      guestIds: t.guestIds.filter((gid) => gid !== id),
      seating: t.seating ? t.seating.filter((gid) => gid !== id) : null,
    }))
  );
  saveIntros(getIntros().filter((i) => i.a !== id && i.b !== id));
}

export function getTables(): Table[] {
  return read<Table>(TABLES_KEY) ?? [];
}

export function saveTables(tables: Table[]) {
  write(TABLES_KEY, tables);
}

export function upsertTable(table: Table) {
  const tables = getTables();
  const i = tables.findIndex((t) => t.id === table.id);
  if (i >= 0) tables[i] = table;
  else tables.push(table);
  saveTables(tables);
}

export function deleteTable(id: string) {
  saveTables(getTables().filter((t) => t.id !== id));
  saveIntros(getIntros().filter((i) => i.tableId !== id));
}

export function getIntros(): Intro[] {
  return read<Intro>(INTROS_KEY) ?? [];
}

export function saveIntros(intros: Intro[]) {
  write(INTROS_KEY, intros);
}

export function upsertIntro(intro: Intro) {
  const intros = getIntros();
  const i = intros.findIndex((x) => x.id === intro.id);
  if (i >= 0) intros[i] = intro;
  else intros.push(intro);
  saveIntros(intros);
}

export function deleteIntro(id: string) {
  saveIntros(getIntros().filter((i) => i.id !== id));
}
