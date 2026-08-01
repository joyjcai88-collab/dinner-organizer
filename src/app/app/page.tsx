"use client";

import { useState, useEffect, useMemo } from "react";
import Wordmark from "@/components/Wordmark";
import { Guest, Table, Intro } from "@/lib/types";
import {
  ensureSeeded,
  seedDemo,
  clearAll,
  isDemoMode,
  getGuests,
  getTables,
  getIntros,
} from "@/lib/store";
import TablesView from "@/components/TablesView";
import GuestsView from "@/components/GuestsView";
import IntrosView from "@/components/IntrosView";
import OverdueView from "@/components/OverdueView";

type View = "tables" | "guests" | "intros" | "overdue";

const NAV: { key: View; label: string }[] = [
  { key: "tables", label: "Tables" },
  { key: "guests", label: "Guests" },
  { key: "intros", label: "Intros" },
  { key: "overdue", label: "Overdue" },
];

export default function App() {
  const [view, setView] = useState<View>("tables");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [intros, setIntros] = useState<Intro[]>([]);
  const [demo, setDemo] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = () => {
    setGuests(getGuests());
    setTables(getTables());
    setIntros(getIntros());
    setDemo(isDemoMode());
  };

  useEffect(() => {
    // "See a real table" always lands on a fresh demo; first visit seeds one too
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      seedDemo();
      window.history.replaceState(null, "", "/app");
    } else {
      ensureSeeded();
    }
    // Everything above touches localStorage, which does not exist during the
    // server render, so the first paint has to be followed by a state sync.
    // Removing this render properly means turning lib/store into a real
    // external store with subscribe/notify and reading it through
    // useSyncExternalStore, which would also retire the onRefresh plumbing
    // threaded through every view. Deliberately out of scope here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    setReady(true);
  }, []);

  const handleReset = () => {
    seedDemo();
    refresh();
  };

  /** seedDemo overwrites all three stores, so warn anyone who has since put
   *  real people in. */
  const handleLoadDemo = () => {
    const hasData = guests.length > 0 || tables.length > 0 || intros.length > 0;
    if (
      hasData &&
      !confirm(
        "Load the demo? This replaces every guest, table and intro in this browser."
      )
    )
      return;
    seedDemo();
    refresh();
  };

  /** First visit seeds the demo, so this is the only way out of it and into
   *  a list of your own people. */
  const handleStartFresh = () => {
    if (
      !confirm(
        "Clear the demo and start with an empty list? This removes every guest, table and intro in this browser."
      )
    )
      return;
    clearAll();
    refresh();
  };

  const rollup = useMemo(() => {
    const wentSomewhere = intros.filter(
      (i) => i.outcome !== "no follow-through"
    ).length;
    return `${tables.length} tables · ${guests.length} guests · ${intros.length} intros logged · ${wentSomewhere} went somewhere`;
  }, [tables, guests, intros]);

  if (!ready) return <div className="min-h-screen bg-paper" />;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line">
        <div className="max-w-7xl mx-auto px-6 py-7">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Wordmark href="/" />
            <div className="flex items-center gap-3">
              {demo ? (
                <>
                  <span className="rounded-full bg-tile px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-secondary">
                    Demo data
                  </span>
                  <button
                    onClick={handleReset}
                    className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-text transition-colors"
                  >
                    Reset demo
                  </button>
                  <button
                    onClick={handleStartFresh}
                    className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-text transition-colors"
                  >
                    Start fresh
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLoadDemo}
                  className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:text-text transition-colors"
                >
                  Load demo
                </button>
              )}
            </div>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-4">
            {rollup}
          </p>
        </div>
        <nav className="border-t border-line">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap gap-x-7">
            {NAV.map((n, i) => (
              <button
                key={n.key}
                data-key={i + 1}
                onClick={() => setView(n.key)}
                className={`tab ${view === n.key ? "active" : ""}`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10 pb-20">
        {view === "tables" && (
          <TablesView guests={guests} tables={tables} intros={intros} onRefresh={refresh} />
        )}
        {view === "guests" && <GuestsView guests={guests} onRefresh={refresh} />}
        {view === "intros" && (
          <IntrosView guests={guests} tables={tables} intros={intros} onRefresh={refresh} />
        )}
        {view === "overdue" && (
          <OverdueView guests={guests} tables={tables} onRefresh={refresh} />
        )}
      </main>
    </div>
  );
}
