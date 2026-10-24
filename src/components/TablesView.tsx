"use client";

import { useMemo, useState } from "react";
import { Attendance, ATTENDANCE_LABELS, Guest, Intro, Table } from "@/lib/types";
import { upsertTable, deleteTable, upsertIntro, upsertGuest } from "@/lib/store";
import {
  proposeSeating,
  annotate,
  pastPairs,
  suggestInvites,
  SeatingNote,
} from "@/lib/seating";
import SeatingChart from "./SeatingChart";
import TableModal from "./TableModal";
import IntroModal from "./IntroModal";
import LumaImportModal from "./LumaImportModal";
import EmailGuestsModal from "./EmailGuestsModal";
import RecapModal from "./RecapModal";
import Select from "./Select";
import {
  applyRecap,
  attendanceCounts,
  dietaryLine,
  dietarySummary,
  isComing,
  recapDue,
  recapDueRecently,
  statusOf,
  venueNote,
} from "@/lib/attendance";
import {
  RoleBadge,
  OutcomeBadge,
  LastSeen,
  PrimaryButton,
  GhostButton,
  LinkButton,
} from "./ui";

interface Props {
  guests: Guest[];
  tables: Table[];
  intros: Intro[];
  onRefresh: () => void;
}

export default function TablesView({ guests, tables, intros, onRefresh }: Props) {
  const byId = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);

  const sorted = useMemo(() => {
    const upcoming = tables
      .filter((t) => t.status === "upcoming")
      .sort((a, b) => a.date.localeCompare(b.date));
    const past = tables
      .filter((t) => t.status === "past")
      .sort((a, b) => b.date.localeCompare(a.date));
    return [...upcoming, ...past];
  }, [tables]);

  // land on the most recent past dinner, already populated
  const defaultId = useMemo(
    () => sorted.find((t) => t.status === "past")?.id ?? sorted[0]?.id ?? null,
    [sorted]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<{
    tableId: string;
    order: string[];
    notes: SeatingNote[];
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [introOpen, setIntroOpen] = useState(false);
  const [lumaOpen, setLumaOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const table = sorted.find((t) => t.id === (selectedId ?? defaultId)) ?? null;

  const tableGuests = useMemo(
    () => (table ? table.guestIds.map((id) => byId.get(id)).filter((g): g is Guest => !!g) : []),
    [table, byId]
  );

  // Declined guests stay on the list but don't get a seat
  const comingGuests = useMemo(
    () => (table ? tableGuests.filter((g) => isComing(statusOf(table, g.id))) : []),
    [table, tableGuests]
  );

  const dietary = useMemo(() => (table ? dietarySummary(table, guests) : null), [table, guests]);

  const tableIntros = useMemo(
    () => (table ? intros.filter((i) => i.tableId === table.id) : []),
    [table, intros]
  );

  // for a table's own annotations, its own night doesn't count as a repeat
  const satElsewhere = useMemo(
    () => pastPairs(tables.filter((t) => t.id !== table?.id)),
    [tables, table]
  );

  const activeProposal = proposal?.tableId === table?.id ? proposal : null;

  const seatingOrder: Guest[] = useMemo(() => {
    const ids = activeProposal?.order ?? table?.seating ?? null;
    if (!ids) return [];
    return ids.map((id) => byId.get(id)).filter((g): g is Guest => !!g);
  }, [activeProposal, table, byId]);

  const seatingNotes: SeatingNote[] = useMemo(() => {
    if (activeProposal) return activeProposal.notes;
    if (seatingOrder.length > 0) return annotate(seatingOrder, satElsewhere);
    return [];
  }, [activeProposal, seatingOrder, satElsewhere]);

  const invites = useMemo(() => {
    if (!table || table.status !== "upcoming") return [];
    if (comingGuests.length >= table.seats) return [];
    return suggestInvites(table, guests, tables).slice(0, 3);
  }, [table, guests, tables, comingGuests]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handlePropose = () => {
    if (!table || comingGuests.length < 3) return;
    const p = proposeSeating(comingGuests, tables);
    setProposal({ tableId: table.id, order: p.order, notes: p.notes });
  };

  const handleSaveSeating = () => {
    if (!table || !activeProposal) return;
    upsertTable({ ...table, seating: activeProposal.order });
    setProposal(null);
    onRefresh();
    showToast("Seating saved.");
  };

  const handleInvite = (g: Guest) => {
    if (!table) return;
    upsertTable({ ...table, guestIds: [...table.guestIds, g.id], seating: null });
    setProposal(null);
    onRefresh();
  };

  const handleCopyGuestList = async () => {
    if (!table) return;
    const lines = [
      `${table.name} · ${table.date} · ${table.venue}`,
      ...tableGuests.map((g) => `- ${g.name} (${g.company}, ${g.role})`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      showToast("Guest list copied.");
    } catch {
      showToast("Couldn't reach the clipboard.");
    }
  };

  // Before the dinner: track RSVPs. After it, attendance changes go through the recap so
  // dinner counts stay right.
  const handleStatus = (g: Guest, status: Attendance) => {
    if (!table) return;
    upsertTable({ ...table, attendance: { ...table.attendance, [g.id]: status }, seating: status === "declined" ? null : table.seating });
    setProposal(null);
    onRefresh();
  };

  const handleRecap = (statuses: Record<string, Attendance>, newIntros: Intro[], note: string | null) => {
    if (!table) return;
    const { table: done, changed } = applyRecap(table, statuses, guests, note);
    changed.forEach(upsertGuest);
    upsertTable(done);
    newIntros.forEach(upsertIntro);
    onRefresh();
    const cameN = Object.values(statuses).filter((s) => s === "attended").length;
    showToast(`Recap saved: ${cameN} came, ${newIntros.length} ${newIntros.length === 1 ? "intro" : "intros"} logged.`);
  };

  const handleCopyVenue = async () => {
    if (!table || !dietary) return;
    try {
      await navigator.clipboard.writeText(venueNote(table, dietary));
      showToast("Dietary note copied.");
    } catch {
      showToast("Couldn't reach the clipboard.");
    }
  };

  const handleDelete = (t: Table) => {
    if (!confirm(`Delete "${t.name}" and its logged intros?`)) return;
    deleteTable(t.id);
    setSelectedId(null);
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
      {/* Table list */}
      <div>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            {tables.length} {tables.length === 1 ? "table" : "tables"}
          </p>
          <div className="flex gap-5">
            <LinkButton onClick={() => setLumaOpen(true)}>↓ Luma</LinkButton>
            <LinkButton
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              + New table
            </LinkButton>
          </div>
        </div>
        <div className="space-y-2">
          {sorted.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedId(t.id);
                setProposal(null);
              }}
              className={`w-full text-left bg-card border rounded-none p-4 transition-colors ${
                t.id === table?.id
                  ? "border-ink"
                  : "border-line hover:bg-tile"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-serif text-[18px] text-text leading-snug">
                  {t.name}
                </p>
                {t.status === "upcoming" && !recapDue(t) && (
                  <span className="rounded-full bg-success-dim text-success font-mono text-[9.5px] uppercase tracking-[0.08em] px-2.5 py-0.5 shrink-0">
                    Upcoming
                  </span>
                )}
                {recapDueRecently(t) && (
                  <span className="rounded-full bg-ink text-paper font-mono text-[9.5px] uppercase tracking-[0.08em] px-2.5 py-0.5 shrink-0">
                    Recap
                  </span>
                )}
              </div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted mt-2">
                {t.date} · {t.venue} · {t.guestIds.length}/{t.seats} seats
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Table detail */}
      {table ? (
        <div className="bg-card border border-line rounded-none p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-serif font-normal text-[20px] md:text-[24px] leading-[1.15] tracking-[-0.025em] text-text">
                {table.name}
              </h2>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted mt-3">
                {table.date} · {table.venue}
                {table.coHost ? ` · co-hosted with ${table.coHost}` : ""}
              </p>
              {table.note && (
                <p className="text-[15px] leading-[1.55] text-secondary mt-3 italic max-w-lg">
                  {table.note}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <GhostButton onClick={() => setEmailOpen(true)}>
                Email guests
              </GhostButton>
              <GhostButton
                onClick={() => {
                  setEditing(table);
                  setModalOpen(true);
                }}
              >
                Edit
              </GhostButton>
              <button
                onClick={() => handleDelete(table)}
                className="px-2 py-[11px] font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-danger transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* After the dinner */}
          {recapDue(table) ? (
            <div className="mt-6 border border-ink px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-serif text-[18px] text-text">How did it go?</p>
                <p className="text-[14.5px] text-secondary mt-1">
                  Confirm who came and log the intros made, while it&apos;s fresh.
                </p>
              </div>
              <PrimaryButton onClick={() => setRecapOpen(true)}>Start recap</PrimaryButton>
            </div>
          ) : table.recapDone ? (
            <div className="mt-5 flex items-center gap-4 flex-wrap">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                Recap done · {attendanceCounts(table).attended ?? 0} came
                {attendanceCounts(table)["no-show"] ? ` · ${attendanceCounts(table)["no-show"]} no-show` : ""}
              </p>
              <LinkButton onClick={() => setRecapOpen(true)}>Edit recap</LinkButton>
            </div>
          ) : null}

          {/* Seating */}
          <div className="mt-8">
            {seatingOrder.length > 0 ? (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                    {activeProposal ? "Proposed seating" : "Seating"}
                  </p>
                  {table.status === "upcoming" && (
                    <div className="flex gap-3">
                      <GhostButton onClick={handlePropose}>
                        {activeProposal ? "Shuffle again" : "Re-propose"}
                      </GhostButton>
                      {activeProposal && (
                        <PrimaryButton onClick={handleSaveSeating}>
                          Save seating
                        </PrimaryButton>
                      )}
                    </div>
                  )}
                </div>
                <SeatingChart order={seatingOrder} />
                {seatingNotes.length > 0 && (
                  <div className="mt-2 border-t border-line pt-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-3">
                      Why this works
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5">
                      {seatingNotes.map((n, i) => (
                        <li
                          key={i}
                          className={`text-[14.5px] leading-[1.55] ${
                            n.kind === "competitor"
                              ? "text-danger"
                              : n.kind === "repeat"
                                ? "text-muted"
                                : "text-secondary"
                          }`}
                        >
                          {n.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="border border-dashed border-line rounded-none p-8 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-5">
                  Seating not set · {tableGuests.length} guests
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-7">
                  {tableGuests.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full px-3 py-1 bg-tile text-[14.5px] text-text flex items-center gap-2"
                    >
                      {g.name}
                      <RoleBadge role={g.role} />
                    </span>
                  ))}
                </div>
                {comingGuests.length >= 3 && table.status === "upcoming" && (
                  <PrimaryButton onClick={handlePropose}>
                    Propose seating
                  </PrimaryButton>
                )}
              </div>
            )}
          </div>

          {/* Guests and where each one stands */}
          {tableGuests.length > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-3">
                {table.status === "upcoming" ? "Guests & RSVPs" : "Who came"} ·{" "}
                {Object.entries(attendanceCounts(table))
                  .map(([s, n]) => `${n} ${ATTENDANCE_LABELS[s as Attendance].toLowerCase()}`)
                  .join(" · ")}
              </p>
              <ul className="divide-y divide-line border-y border-line">
                {tableGuests.map((g) => {
                  const st = statusOf(table, g.id);
                  return (
                    <li key={g.id} className="flex items-center justify-between gap-3 py-2 flex-wrap">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className={`font-serif text-[16px] truncate ${isComing(st) ? "text-text" : "text-muted line-through decoration-line"}`}>
                          {g.name}
                        </span>
                        <RoleBadge role={g.role} />
                      </span>
                      {table.status === "upcoming" && !recapDue(table) ? (
                        <span className="w-[150px]">
                          <Select
                            value={st}
                            onChange={(e) => handleStatus(g, e.target.value as Attendance)}
                            aria-label={`${g.name} RSVP`}
                          >
                            <option value="invited">Invited</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="declined">Declined</option>
                          </Select>
                        </span>
                      ) : (
                        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-secondary">
                          {ATTENDANCE_LABELS[st]}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Dietary needs, ready to send the venue */}
          {dietary && dietary.coming > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                    For the venue · {dietary.coming} guests
                  </p>
                  <p className="font-serif text-[18px] text-text mt-2">
                    {dietaryLine(dietary) || "No dietary needs noted"}
                  </p>
                  {(dietary.needs.length > 0 || dietary.other.length > 0) && (
                    <ul className="mt-2 space-y-1">
                      {dietary.needs.map((n) => (
                        <li key={n.need} className="text-[14.5px] text-secondary">
                          <span className="text-text">{n.need}:</span> {n.names.join(", ")}
                        </li>
                      ))}
                      {dietary.other.map((o) => (
                        <li key={o.name} className="text-[14.5px] text-secondary">
                          <span className="text-text">{o.name}:</span> {o.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <GhostButton onClick={handleCopyVenue}>Copy for the venue</GhostButton>
              </div>
            </div>
          )}

          {/* Suggested invites for open seats */}
          {invites.length > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-4">
                {table.seats - comingGuests.length} seats open · suggested invites
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {invites.map((g) => (
                  <div key={g.id} className="border border-line rounded-none p-4">
                    <p className="font-serif text-[18px] text-text leading-snug">
                      {g.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-1.5">
                      {g.company}
                    </p>
                    <p className="text-[14.5px] text-secondary mt-2">
                      Last seen <LastSeen iso={g.lastSeen} />
                    </p>
                    <div className="mt-3">
                      <LinkButton onClick={() => handleInvite(g)}>
                        + Add to table
                      </LinkButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intros at this table */}
          <div className="mt-8 border-t border-line pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                Intros made here
              </p>
              <LinkButton onClick={() => setIntroOpen(true)}>
                + Log intro
              </LinkButton>
            </div>
            {tableIntros.length === 0 ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                None logged yet
              </p>
            ) : (
              <ul className="space-y-2.5">
                {tableIntros.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center gap-3 text-[14.5px] flex-wrap"
                  >
                    <span className="text-text">
                      {byId.get(i.a)?.name.split(" ")[0]} ·{" "}
                      {byId.get(i.b)?.name.split(" ")[0]}
                    </span>
                    <OutcomeBadge outcome={i.outcome} />
                    {i.detail && (
                      <span className="text-secondary">{i.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Past tables are worth copying too. The only thing that makes the
              button pointless is having nobody to copy. */}
          {tableGuests.length > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <GhostButton onClick={handleCopyGuestList}>Copy guest list</GhostButton>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-line rounded-none px-6 py-16 text-center">
          <p className="font-serif font-normal text-[20px] text-text">
            No tables yet
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-3 mb-7">
            Create your first table or load the demo
          </p>
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + New table
          </PrimaryButton>
        </div>
      )}

      {modalOpen && (
        <TableModal
          editing={editing}
          guests={guests}
          onClose={() => setModalOpen(false)}
          onSave={(t) => {
            upsertTable(t);
            setSelectedId(t.id);
            onRefresh();
          }}
        />
      )}
      {lumaOpen && (
        <LumaImportModal
          guests={guests}
          tables={tables}
          onClose={() => setLumaOpen(false)}
          onImported={(tableId) => {
            setSelectedId(tableId);
            onRefresh();
            showToast("Luma event imported.");
          }}
        />
      )}
      {emailOpen && table && (
        <EmailGuestsModal
          table={table}
          guests={tableGuests}
          onClose={() => setEmailOpen(false)}
          onSaveEmail={(g) => {
            upsertGuest(g);
            onRefresh();
          }}
        />
      )}
      {recapOpen && table && (
        <RecapModal
          table={table}
          guests={tableGuests}
          onClose={() => setRecapOpen(false)}
          onSave={handleRecap}
        />
      )}
      {introOpen && table && (
        <IntroModal
          editing={null}
          guests={guests}
          tables={tables}
          presetTableId={table.id}
          onClose={() => setIntroOpen(false)}
          onSave={(i) => {
            upsertIntro(i);
            onRefresh();
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-ink text-paper rounded-none px-5 py-3 text-[14.5px] z-[150]">
          {toast}
        </div>
      )}
    </div>
  );
}
