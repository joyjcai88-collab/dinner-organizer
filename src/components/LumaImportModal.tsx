"use client";

import { useMemo, useState } from "react";
import { Guest, Table } from "@/lib/types";
import {
  LumaGuestRow,
  LumaEventInfo,
  parseLumaCSV,
  planLumaImport,
  applyLumaImport,
  eventNameFromFilename,
} from "@/lib/luma";
import { Modal, PrimaryButton, GhostButton, inputCls, labelCls } from "./ui";

interface LumaApiEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
}

interface Props {
  guests: Guest[];
  tables: Table[];
  onClose: () => void;
  onImported: (tableId: string) => void;
}

const KEY_STORAGE = "covers-luma-key";

export default function LumaImportModal({ guests, tables, onClose, onImported }: Props) {
  const [method, setMethod] = useState<"csv" | "api">("csv");
  const [rows, setRows] = useState<LumaGuestRow[] | null>(null);
  const [event, setEvent] = useState<LumaEventInfo>({ name: "", date: "", venue: "" });
  const [includeNotGoing, setIncludeNotGoing] = useState(false);
  const [error, setError] = useState("");

  // API path state
  const [apiKey, setApiKey] = useState(
    typeof window === "undefined" ? "" : (localStorage.getItem(KEY_STORAGE) ?? "")
  );
  const [apiEvents, setApiEvents] = useState<LumaApiEvent[] | null>(null);
  const [loading, setLoading] = useState(false);

  const plan = useMemo(() => {
    if (!rows || !event.name.trim() || !event.date) return null;
    return planLumaImport(rows, event, guests, includeNotGoing);
  }, [rows, event, guests, includeNotGoing]);

  const duplicate = useMemo(
    () => tables.some((t) => t.name === event.name.trim() && t.date === event.date),
    [tables, event]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseLumaCSV(ev.target?.result as string);
        if (parsed.length === 0) {
          setError("No guests found. Is this the guest-list CSV from your Luma event?");
          return;
        }
        setRows(parsed);
        // Luma names the file "<Event Name> - Guests - <timestamp>.csv"
        const suggested = eventNameFromFilename(file.name);
        if (suggested) setEvent((f) => ({ ...f, name: f.name || suggested }));
      } catch {
        setError("Failed to parse the CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const fetchEvents = async () => {
    setError("");
    setLoading(true);
    try {
      localStorage.setItem(KEY_STORAGE, apiKey);
      const res = await fetch("/api/luma/events", {
        headers: { "x-luma-key": apiKey },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Luma returned ${res.status}`);
      }
      const data = await res.json();
      setApiEvents(data.events);
      if (data.events.length === 0) setError("No events found on this calendar.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reach Luma.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async (ev: LumaApiEvent) => {
    setError("");
    setLoading(true);
    setEvent({ name: ev.name, date: ev.date, venue: ev.venue });
    try {
      const res = await fetch(`/api/luma/guests?event=${encodeURIComponent(ev.id)}`, {
        headers: { "x-luma-key": apiKey },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Luma returned ${res.status}`);
      }
      const data = await res.json();
      if (data.rows.length === 0) {
        setError("That event has no guests yet.");
        setRows(null);
        return;
      }
      setRows(data.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reach Luma.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!plan || duplicate) return;
    const tableId = applyLumaImport(plan);
    onImported(tableId);
    onClose();
  };

  const tabCls = (active: boolean) =>
    `flex-1 rounded-full py-[11px] font-mono text-[10.5px] uppercase tracking-[0.08em] transition-colors ${
      active
        ? "bg-ink text-paper"
        : "bg-pill text-secondary hover:bg-pill-hi"
    }`;

  return (
    <Modal
      title="Import from Luma"
      subtitle="A Luma event becomes a table; its guests join your graph"
      onClose={onClose}
      wide
    >
      <div className="flex gap-2 mb-6">
        <button className={tabCls(method === "csv")} onClick={() => setMethod("csv")}>
          Guest list CSV
        </button>
        <button className={tabCls(method === "api")} onClick={() => setMethod("api")}>
          Calendar API
        </button>
      </div>

      {method === "csv" && !rows && (
        <div>
          <label
            className="block border border-dashed border-line rounded-none p-10 text-center cursor-pointer hover:border-accent transition-colors"
          >
            <p className="font-serif text-[18px] text-text">
              Drop the guest-list CSV here or click to browse
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-3">
              Luma event → Guests → download icon
            </p>
            <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </label>
        </div>
      )}

      {method === "api" && !rows && (
        <div className="space-y-6">
          <div>
            <label className={labelCls}>Luma API key</label>
            <div className="flex items-end gap-4">
              <input
                type="password"
                className={inputCls}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="secret-…"
              />
              <div className="shrink-0">
                <GhostButton onClick={fetchEvents}>
                  {loading ? "Loading…" : "Fetch events"}
                </GhostButton>
              </div>
            </div>
            <p className="text-[14.5px] leading-[1.55] text-secondary mt-3">
              Calendar Settings → Developer → API Keys (requires Luma Plus). The key
              stays in your browser; Covers only relays the request and never stores it.
            </p>
          </div>
          {apiEvents && apiEvents.length > 0 && (
            <div>
              <label className={labelCls}>Pick an event</label>
              <div className="border border-line rounded-none max-h-56 overflow-y-auto divide-y divide-line mt-1">
                {apiEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => fetchGuests(ev)}
                    className="w-full text-left px-4 py-3 hover:bg-tile transition-colors"
                  >
                    <p className="font-serif text-[18px] text-text leading-snug">
                      {ev.name}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-1.5">
                      {ev.date}
                      {ev.venue ? ` · ${ev.venue}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {rows && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div className="col-span-2">
              <label className={labelCls}>Table name</label>
              <input
                className={inputCls}
                value={event.name}
                onChange={(e) => setEvent((f) => ({ ...f, name: e.target.value }))}
                placeholder="AI infra, off the record"
              />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                className={inputCls}
                value={event.date}
                onChange={(e) => setEvent((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Venue</label>
              <input
                className={inputCls}
                value={event.venue}
                onChange={(e) => setEvent((f) => ({ ...f, venue: e.target.value }))}
                placeholder="TBD"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-[14.5px] text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={includeNotGoing}
              onChange={(e) => setIncludeNotGoing(e.target.checked)}
            />
            Include invited / waitlisted guests who didn&apos;t RSVP yes
          </label>

          {plan && (
            <div className="border border-line rounded-none p-5 text-[14.5px] leading-[1.55] space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                Import preview
              </p>
              <p className="text-text">
                {`${plan.newGuests.length} new guest${plan.newGuests.length === 1 ? "" : "s"}`}
                {plan.newGuests.length > 0 && (
                  <span className="text-secondary">
                    {" "}
                    · {plan.newGuests.slice(0, 4).map((g) => g.name.split(" ")[0]).join(", ")}
                    {plan.newGuests.length > 4 ? "…" : ""}
                  </span>
                )}
              </p>
              <p className="text-text">
                {plan.matched.length} already in your graph
                {plan.matched.length > 0 && plan.isPast && (
                  <span className="text-secondary">
                    {" "}
                    · their last-seen and dinner counts update
                  </span>
                )}
              </p>
              {plan.skipped.length > 0 && (
                <p className="text-secondary">
                  {`${plan.skipped.length} skipped (didn't RSVP yes)`}
                </p>
              )}
              {duplicate && (
                <p className="text-danger">
                  A table with this name and date already exists — looks imported.
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setRows(null);
              setApiEvents(null);
              setError("");
            }}
            className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-text transition-colors"
          >
            ← Start over
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-10">
        <div className="flex-1">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
        <PrimaryButton
          disabled={!plan || duplicate || plan.newGuests.length + plan.matched.length === 0}
          onClick={handleImport}
        >
          {plan
            ? `Import ${plan.newGuests.length + plan.matched.length} guests`
            : "Import"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
