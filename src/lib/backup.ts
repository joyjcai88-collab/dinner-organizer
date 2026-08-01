// Everything lives in this browser's localStorage. There is no account and no
// sync, so clearing site data, switching browsers or switching devices loses
// the lot. A file you own is the only way out of that, and the only way to
// move a guest list between devices.

import { Guest, Table, Intro } from "./types";

export const BACKUP_FORMAT = "be-my-guest-backup";
export const BACKUP_VERSION = 1;

export interface Backup {
  format: string;
  version: number;
  exportedAt: string;
  guests: Guest[];
  tables: Table[];
  intros: Intro[];
}

export function buildBackup(
  guests: Guest[],
  tables: Table[],
  intros: Intro[],
  exportedAt: string
): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    guests,
    tables,
    intros,
  };
}

export class BackupError extends Error {}

/**
 * Parse a backup file. Deliberately strict about the envelope, because
 * restoring replaces everything: better to refuse a file we do not recognise
 * than to wipe a real guest list with a half-understood one.
 */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError("That file isn't valid JSON.");
  }

  if (typeof raw !== "object" || raw === null) {
    throw new BackupError("That file isn't a backup.");
  }
  const data = raw as Partial<Backup>;

  if (data.format !== BACKUP_FORMAT) {
    throw new BackupError("That file isn't a Be My Guest backup.");
  }
  if (typeof data.version !== "number" || data.version > BACKUP_VERSION) {
    throw new BackupError(
      "That backup came from a newer version of the app. Update it first."
    );
  }
  for (const key of ["guests", "tables", "intros"] as const) {
    if (!Array.isArray(data[key])) {
      throw new BackupError(`That backup is missing its ${key}.`);
    }
  }

  return {
    format: BACKUP_FORMAT,
    version: data.version,
    exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : "",
    guests: data.guests as Guest[],
    tables: data.tables as Table[],
    intros: data.intros as Intro[],
  };
}
