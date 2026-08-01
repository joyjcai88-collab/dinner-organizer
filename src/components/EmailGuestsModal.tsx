"use client";

import { useMemo, useState } from "react";
import { Guest, Table } from "@/lib/types";
import { renderInvite, OtherGuest, DinnerDetails } from "@/lib/email";
import { Modal, PrimaryButton, GhostButton, labelCls } from "./ui";

/** Deliberately permissive: this only catches obvious typos. Real delivery
 * is the mail client's problem, and over-strict rules reject valid addresses. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

interface Props {
  table: Table;
  guests: Guest[]; // this table's guests, resolved from guestIds
  onClose: () => void;
  /** Persist an email filled in here. The parent owns the write, matching
   * how the other modals in this view save. */
  onSaveEmail: (guest: Guest) => void;
}

// Several mail clients (Outlook in particular) start truncating or
// rejecting mailto: links somewhere past ~2000 characters. Stay well clear
// of that so "Open in email app" never hands the OS a broken link.
const MAILTO_SAFE_LENGTH = 1800;

/** Percent-encode one mailto URL component. encodeURIComponent leaves
 * !'()* unescaped because they're valid in a URI, but they're not safe
 * inside every mailto handler, so escape them by hand too. Newlines come
 * through as %0A via the normal encodeURIComponent pass. */
function encodeMailtoComponent(s: string): string {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/** Recipients go in bcc, never to/cc, so guests never see each other's
 * addresses. */
function buildMailto(bccEmails: string[], subject: string, body: string): string {
  const bcc = bccEmails.map(encodeMailtoComponent).join(",");
  return `mailto:?bcc=${bcc}&subject=${encodeMailtoComponent(subject)}&body=${encodeMailtoComponent(body)}`;
}

export default function EmailGuestsModal({
  table,
  guests,
  onClose,
  onSaveEmail,
}: Props) {
  const withEmail = useMemo(() => guests.filter((g) => g.email.trim() !== ""), [guests]);
  const withoutEmail = useMemo(() => guests.filter((g) => g.email.trim() === ""), [guests]);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(withEmail.map((g) => g.id))
  );
  const [includeOthers, setIncludeOthers] = useState(false);
  const [copiedAddresses, setCopiedAddresses] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copyError, setCopyError] = useState("");
  // Emails typed in for guests who have none, keyed by guest id.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

  const saveDraft = (guest: Guest) => {
    const email = (drafts[guest.id] ?? "").trim();
    if (email === "") return;
    if (!EMAIL_PATTERN.test(email)) {
      setDraftErrors((prev) => ({ ...prev, [guest.id]: "That address doesn't look right" }));
      return;
    }
    setDraftErrors((prev) => {
      const next = { ...prev };
      delete next[guest.id];
      return next;
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[guest.id];
      return next;
    });
    // Select them straight away: filling the address in here means you
    // intend to write to them.
    setSelected((prev) => new Set(prev).add(guest.id));
    onSaveEmail({ ...guest, email });
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dinner: DinnerDetails = useMemo(
    () => ({
      name: table.name,
      date: table.date,
      venue: table.venue,
      coHost: table.coHost,
      note: table.note,
    }),
    [table.name, table.date, table.venue, table.coHost, table.note]
  );

  const otherGuestsAll: OtherGuest[] = useMemo(
    () => guests.map((g) => ({ name: g.name, company: g.company })),
    [guests]
  );

  const invite = useMemo(
    () => renderInvite(dinner, includeOthers ? otherGuestsAll : null),
    [dinner, includeOthers, otherGuestsAll]
  );

  const selectedRecipients = useMemo(
    () => withEmail.filter((g) => selected.has(g.id)),
    [withEmail, selected]
  );
  const selectedEmails = useMemo(
    () => selectedRecipients.map((g) => g.email),
    [selectedRecipients]
  );
  const selectedCount = selectedRecipients.length;

  const mailtoUrl = useMemo(
    () => buildMailto(selectedEmails, invite.subject, invite.body),
    [selectedEmails, invite]
  );
  const mailtoTooLong = mailtoUrl.length > MAILTO_SAFE_LENGTH;
  const canOpenEmail = selectedCount > 0 && !mailtoTooLong;

  const handleOpenEmail = () => {
    if (!canOpenEmail) return;
    window.location.href = mailtoUrl;
  };

  const handleCopyAddresses = async () => {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(selectedEmails.join(", "));
      setCopiedAddresses(true);
      setTimeout(() => setCopiedAddresses(false), 2000);
    } catch {
      setCopyError("Couldn't reach the clipboard.");
    }
  };

  const handleCopyMessage = async () => {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(`Subject: ${invite.subject}\n\n${invite.body}`);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch {
      setCopyError("Couldn't reach the clipboard.");
    }
  };

  return (
    <Modal
      title="Email guests"
      subtitle={`${table.name} · opens in your own email app`}
      onClose={onClose}
      wide
    >
      <div className="space-y-6">
        {/* Guest list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls}>Recipients</label>
            {withoutEmail.length > 0 && (
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                {withoutEmail.length} of {guests.length} guests have no email
              </span>
            )}
          </div>
          <div className="border border-line rounded-none divide-y divide-line max-h-64 overflow-y-auto">
            {withEmail.map((g) => (
              <label
                key={g.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-tile transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(g.id)}
                  onChange={() => toggle(g.id)}
                />
                <span className="font-serif text-[15px] text-text">{g.name}</span>
                <span className="font-mono text-[10.5px] text-muted ml-auto">{g.email}</span>
              </label>
            ))}
            {withoutEmail.map((g) => (
              <div key={g.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={false} disabled />
                  <span className="font-serif text-[15px] text-text shrink-0">{g.name}</span>
                  <input
                    type="email"
                    value={drafts[g.id] ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDrafts((prev) => ({ ...prev, [g.id]: value }));
                    }}
                    onBlur={() => saveDraft(g)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveDraft(g);
                      }
                    }}
                    placeholder="Add an email"
                    aria-label={`Email address for ${g.name}`}
                    className="field ml-auto max-w-[260px] text-right font-mono text-[11px]"
                  />
                </div>
                {draftErrors[g.id] && (
                  <p className="mt-1.5 text-right font-mono text-[10px] uppercase tracking-[0.08em] text-danger">
                    {draftErrors[g.id]}
                  </p>
                )}
              </div>
            ))}
            {guests.length === 0 && (
              <p className="px-4 py-6 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                This table has no guests yet
              </p>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-[14.5px] text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={includeOthers}
            onChange={(e) => setIncludeOthers(e.target.checked)}
          />
          Include who else is coming
        </label>

        {/* Preview */}
        <div>
          <label className={labelCls}>Preview</label>
          <div className="border border-line rounded-none p-5 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              Subject
            </p>
            <p className="font-serif text-[16px] text-text">{invite.subject}</p>
            <div className="border-t border-line pt-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-2">
                Body
              </p>
              <pre className="font-serif text-[14.5px] leading-[1.55] text-text whitespace-pre-wrap">
                {invite.body}
              </pre>
            </div>
          </div>
        </div>

        {/* Fallbacks */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button
            onClick={handleCopyAddresses}
            disabled={selectedCount === 0}
            className="font-mono text-[10px] uppercase tracking-[0.08em] text-secondary hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {copiedAddresses ? "Copied" : "Copy addresses"}
          </button>
          <button
            onClick={handleCopyMessage}
            className="font-mono text-[10px] uppercase tracking-[0.08em] text-secondary hover:text-accent transition-colors"
          >
            {copiedMessage ? "Copied" : "Copy message"}
          </button>
          {copyError && (
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-danger">
              {copyError}
            </span>
          )}
        </div>

        {selectedCount === 0 ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            Select at least one guest with an email to continue
          </p>
        ) : (
          mailtoTooLong && (
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-warn">
              This guest list is too long for a mailto link. Use copy addresses and copy
              message instead.
            </p>
          )
        )}
      </div>

      <div className="flex gap-3 mt-10">
        <div className="flex-1">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
        <PrimaryButton disabled={!canOpenEmail} onClick={handleOpenEmail}>
          Open in email app
        </PrimaryButton>
      </div>
    </Modal>
  );
}
