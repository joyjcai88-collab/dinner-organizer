"use client";

import { useMemo, useState } from "react";
import { Guest, Intro, Table } from "@/lib/types";
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
  const [toast, setToast] = useState<string | null>(null);

  const table = sorted.find((t) => t.id === (selectedId ?? defaultId)) ?? null;

  const tableGuests = useMemo(
    () => (table ? table.guestIds.map((id) => byId.get(id)).filter((g): g is Guest => !!g) : []),
    [table, byId]
  );

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
    if (table.guestIds.length >= table.seats) return [];
    return suggestInvites(table, guests, tables).slice(0, 3);
  }, [table, guests, tables]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handlePropose = () => {
    if (!table || tableGuests.length < 3) return;
    const p = proposeSeating(tableGuests, tables);
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
            {tables.length} tables
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
                {t.status === "upcoming" && (
                  <span className="rounded-full bg-success-dim text-success font-mono text-[9.5px] uppercase tracking-[0.08em] px-2.5 py-0.5 shrink-0">
                    Upcoming
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
              <h2 className="font-serif font-normal text-[32px] leading-[1.1] tracking-[-0.025em] text-text">
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
            <div className="flex items-center gap-3">
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
                {tableGuests.length >= 3 && table.status === "upcoming" && (
                  <PrimaryButton onClick={handlePropose}>
                    Propose seating
                  </PrimaryButton>
                )}
              </div>
            )}
          </div>

          {/* Suggested invites for open seats */}
          {invites.length > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-4">
                {table.seats - table.guestIds.length} seats open · suggested invites
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-paper rounded-none px-5 py-3 text-[14.5px] z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
