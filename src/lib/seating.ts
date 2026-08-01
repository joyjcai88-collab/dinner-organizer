import { Guest, Table } from "./types";

export interface SeatingNote {
  aId: string;
  bId: string;
  kind: "pairing" | "energy" | "repeat" | "competitor";
  text: string;
}

export interface SeatingProposal {
  order: string[]; // guest ids clockwise around the table
  notes: SeatingNote[];
  score: number;
}

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Every pair that has shared a past table. */
export function pastPairs(tables: Table[]): Set<string> {
  const seen = new Set<string>();
  for (const t of tables) {
    if (t.status !== "past") continue;
    for (let i = 0; i < t.guestIds.length; i++) {
      for (let j = i + 1; j < t.guestIds.length; j++) {
        seen.add(pairKey(t.guestIds[i], t.guestIds[j]));
      }
    }
  }
  return seen;
}

function areCompetitors(a: Guest, b: Guest): boolean {
  return (
    a.role === "founder" &&
    b.role === "founder" &&
    !!a.sector &&
    a.sector === b.sector &&
    !!a.stage &&
    a.stage === b.stage
  );
}

function scorePair(a: Guest, b: Guest, sat: Set<string>): number {
  let s = 0;
  if (areCompetitors(a, b)) s -= 100; // hard rule: competitors never adjacent
  if (sat.has(pairKey(a.id, b.id))) s -= 4; // already shared a table
  const roles = [a.role, b.role].sort().join("+");
  if (roles === "founder+vc") s += 3;
  if (roles === "engineer+founder") s += 2;
  if (roles === "founder+operator") s += 1;
  if (a.socialEnergy === "high" && b.socialEnergy === "high") s -= 2; // spread the talkers
  if (
    (a.socialEnergy === "high" && b.socialEnergy === "low") ||
    (a.socialEnergy === "low" && b.socialEnergy === "high")
  )
    s += 1;
  return s;
}

function scoreOrder(order: Guest[], sat: Set<string>): number {
  let total = 0;
  for (let i = 0; i < order.length; i++) {
    total += scorePair(order[i], order[(i + 1) % order.length], sat);
  }
  return total;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Rules, not ML: random restarts + greedy 2-swaps over a circular arrangement.
 * Small n makes this effectively optimal in a few hundred iterations.
 */
export function proposeSeating(guests: Guest[], allTables: Table[]): SeatingProposal {
  const sat = pastPairs(allTables);
  let best: Guest[] = guests;
  let bestScore = -Infinity;

  for (let r = 0; r < 300; r++) {
    let order = shuffle(guests);
    let score = scoreOrder(order, sat);
    // greedy improvement: try all pairwise swaps until no gain
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < order.length; i++) {
        for (let j = i + 1; j < order.length; j++) {
          const next = [...order];
          [next[i], next[j]] = [next[j], next[i]];
          const s = scoreOrder(next, sat);
          if (s > score) {
            order = next;
            score = s;
            improved = true;
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = order;
    }
  }

  return { order: best.map((g) => g.id), notes: annotate(best, sat), score: bestScore };
}

/** Explain the adjacencies of an arrangement — used for proposals and saved seatings. */
export function annotate(order: Guest[], sat: Set<string>): SeatingNote[] {
  const notes: SeatingNote[] = [];
  for (let i = 0; i < order.length; i++) {
    const a = order[i];
    const b = order[(i + 1) % order.length];
    const first = (g: Guest) => g.name.split(" ")[0];
    const roles = [a.role, b.role].sort().join("+");
    if (areCompetitors(a, b)) {
      notes.push({ aId: a.id, bId: b.id, kind: "competitor", text: `${first(a)} and ${first(b)} are direct competitors: keep apart` });
    } else if (roles === "founder+vc") {
      notes.push({ aId: a.id, bId: b.id, kind: "pairing", text: `${first(a)} · ${first(b)}: founder next to investor` });
    } else if (roles === "engineer+founder") {
      notes.push({ aId: a.id, bId: b.id, kind: "pairing", text: `${first(a)} · ${first(b)}: founder next to an engineer they could hire` });
    }
    if (sat.has(pairKey(a.id, b.id))) {
      notes.push({ aId: a.id, bId: b.id, kind: "repeat", text: `${first(a)} and ${first(b)} have shared a table before` });
    } else if (a.socialEnergy === "high" && b.socialEnergy === "low") {
      notes.push({ aId: a.id, bId: b.id, kind: "energy", text: `${first(a)} carries the conversation for ${first(b)}` });
    } else if (a.socialEnergy === "low" && b.socialEnergy === "high") {
      notes.push({ aId: a.id, bId: b.id, kind: "energy", text: `${first(b)} carries the conversation for ${first(a)}` });
    }
  }
  return notes;
}

/** Rank guests not at this table as fills for open seats. */
export function suggestInvites(table: Table, guests: Guest[], allTables: Table[]): Guest[] {
  const atTable = new Set(table.guestIds);
  const tableGuests = guests.filter((g) => atTable.has(g.id));
  const roleCount = (role: Guest["role"]) => tableGuests.filter((g) => g.role === role).length;
  const now = Date.now();
  const sat = pastPairs(allTables);

  return guests
    .filter((g) => !atTable.has(g.id))
    .map((g) => {
      let score = g.strength;
      // pull overdue people back to the table
      if (g.lastSeen) {
        const months = (now - new Date(g.lastSeen).getTime()) / (30.44 * 24 * 3600 * 1000);
        if (months >= 6) score += 3;
        else if (months >= 3) score += 2;
      }
      // balance the role mix
      if (g.role === "vc" && roleCount("vc") === 0) score += 2;
      if (g.role === "engineer" && roleCount("engineer") === 0) score += 1;
      // don't invite a competitor of someone already seated
      if (tableGuests.some((t) => areCompetitors(g, t))) score -= 100;
      // prefer someone this table hasn't already met, matching how
      // proposeSeating treats repeat pairs
      score -= tableGuests.filter((t) => sat.has(pairKey(g.id, t.id))).length;
      return { g, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.g);
}

export function monthsSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / (30.44 * 24 * 3600 * 1000);
}
