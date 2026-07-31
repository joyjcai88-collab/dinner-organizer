"use client";

import { useEffect } from "react";
import { IntroOutcome, Role, ROLE_LABELS } from "@/lib/types";
import { monthsSince } from "@/lib/seating";

const badgeCls =
  "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] whitespace-nowrap";

const OUTCOME_COLORS: Record<IntroOutcome, string> = {
  "no follow-through": "bg-tile text-muted",
  "stayed in touch": "bg-tile text-text",
  "working together": "bg-success-dim text-success",
  hire: "bg-success-dim text-success",
  investment: "bg-success-dim text-success",
  "co-founded": "bg-ink text-paper",
};

export function OutcomeBadge({ outcome }: { outcome: IntroOutcome }) {
  return (
    <span className={`${badgeCls} ${OUTCOME_COLORS[outcome]}`}>{outcome}</span>
  );
}

export const ROLE_COLORS: Record<Role, string> = {
  founder: "bg-tile text-text",
  engineer: "bg-tile text-secondary",
  vc: "bg-success-dim text-success",
  operator: "border border-line text-secondary",
  other: "bg-tile text-muted",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`${badgeCls} ${ROLE_COLORS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

/** 5-step relationship score as a 2px bar. */
export function StrengthBar({ value }: { value: number }) {
  return (
    <span
      className="inline-block w-16 h-[2px] bg-[#dcdcdc] align-middle"
      title={`Relationship strength ${value}/5`}
    >
      <span
        className="block h-full bg-accent"
        style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}
      />
    </span>
  );
}

export function LastSeen({ iso }: { iso: string | null }) {
  const months = monthsSince(iso);
  if (months === null) return <span className="text-muted">never</span>;
  const label =
    months < 1
      ? "this month"
      : `${Math.floor(months)} month${Math.floor(months) === 1 ? "" : "s"} ago`;
  const cls =
    months >= 6 ? "text-danger" : months >= 3 ? "text-text" : "text-secondary";
  return <span className={cls}>{label}</span>;
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-card border border-line rounded-none w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto ${wide ? "max-w-2xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif font-normal text-2xl text-text tracking-[-0.02em]">
          {title}
        </h2>
        {subtitle && (
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-2 mb-7">
            {subtitle}
          </p>
        )}
        {!subtitle && <div className="mb-7" />}
        {children}
      </div>
    </div>
  );
}

export const inputCls = "field";

export const labelCls =
  "block font-mono text-[10px] uppercase tracking-[0.08em] text-muted mb-1";

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full px-6 py-[11px] bg-ink text-paper font-mono text-[10.5px] uppercase tracking-[0.08em] hover:opacity-[0.82] disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-6 py-[11px] bg-pill text-text font-mono text-[10.5px] uppercase tracking-[0.08em] hover:bg-pill-hi transition-colors"
    >
      {children}
    </button>
  );
}

/** Quiet inline action, e.g. "+ New table". */
export function LinkButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="font-mono text-[10px] uppercase tracking-[0.08em] text-secondary hover:text-accent transition-colors"
    >
      {children}
    </button>
  );
}
