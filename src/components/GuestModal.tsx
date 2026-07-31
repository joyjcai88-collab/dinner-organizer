"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Guest, Role, SocialEnergy, ROLE_LABELS } from "@/lib/types";
import { Modal, PrimaryButton, GhostButton, inputCls, labelCls } from "./ui";

interface Props {
  editing: Guest | null;
  onClose: () => void;
  onSave: (guest: Guest) => void;
}

export default function GuestModal({ editing, onClose, onSave }: Props) {
  const [form, setForm] = useState<Guest>(
    editing ?? {
      id: uuid(),
      name: "",
      role: "founder",
      company: "",
      title: "",
      email: "",
      linkedinUrl: "",
      sector: null,
      stage: null,
      strength: 3,
      socialEnergy: "medium",
      hosted: 0,
      lastSeen: null,
      notes: null,
      createdAt: new Date().toISOString(),
    }
  );

  const set = <K extends keyof Guest>(key: K, value: Guest[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal
      title={editing ? form.name : "Add guest"}
      subtitle={editing ? "Edit guest" : "Everything here feeds seating and staleness"}
      onClose={onClose}
      wide
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        <div className="col-span-2 md:col-span-1">
          <label className={labelCls}>Name</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className={labelCls}>Company</label>
          <input
            className={inputCls}
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Role</label>
          <select
            className={inputCls}
            value={form.role}
            onChange={(e) => set("role", e.target.value as Role)}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Social energy</label>
          <select
            className={inputCls}
            value={form.socialEnergy}
            onChange={(e) => set("socialEnergy", e.target.value as SocialEnergy)}
          >
            <option value="high">High: carries the table</option>
            <option value="medium">Medium</option>
            <option value="low">Low: needs drawing out</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Sector</label>
          <input
            className={inputCls}
            value={form.sector ?? ""}
            onChange={(e) => set("sector", e.target.value || null)}
            placeholder="devtools, healthtech…"
          />
        </div>
        <div>
          <label className={labelCls}>Stage</label>
          <select
            className={inputCls}
            value={form.stage ?? ""}
            onChange={(e) => set("stage", e.target.value || null)}
          >
            <option value="">n/a</option>
            <option value="pre-seed">Pre-seed</option>
            <option value="seed">Seed</option>
            <option value="series-a">Series A</option>
            <option value="series-b">Series B+</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Relationship strength: {form.strength}/5</label>
          <input
            type="range"
            min={1}
            max={5}
            value={form.strength}
            onChange={(e) => set("strength", Number(e.target.value))}
            className="w-full mt-2"
          />
        </div>
        <div>
          <label className={labelCls}>Last seen</label>
          <input
            type="date"
            className={inputCls}
            value={form.lastSeen ?? ""}
            onChange={(e) => set("lastSeen", e.target.value || null)}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>
            Table memory (dietary, habits, seating flags)
          </label>
          <textarea
            className={inputCls}
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value || null)}
            placeholder="Vegetarian. Arrives late. Don't seat near press."
          />
        </div>
      </div>

      <div className="flex gap-3 mt-10">
        <div className="flex-1">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
        <PrimaryButton
          disabled={!form.name.trim()}
          onClick={() => {
            onSave(form);
            onClose();
          }}
        >
          {editing ? "Save" : "Add guest"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
