"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Guest, Table } from "@/lib/types";
import { Modal, PrimaryButton, GhostButton, RoleBadge, inputCls, labelCls } from "./ui";

interface Props {
  editing: Table | null;
  guests: Guest[];
  onClose: () => void;
  onSave: (table: Table) => void;
}

export default function TableModal({ editing, guests, onClose, onSave }: Props) {
  const [form, setForm] = useState<Table>(
    editing ?? {
      id: uuid(),
      name: "",
      date: "",
      venue: "",
      coHost: null,
      seats: 8,
      status: "upcoming",
      guestIds: [],
      seating: null,
      note: null,
    }
  );

  const set = <K extends keyof Table>(key: K, value: Table[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleGuest = (id: string) => {
    setForm((f) => {
      const has = f.guestIds.includes(id);
      return {
        ...f,
        guestIds: has ? f.guestIds.filter((g) => g !== id) : [...f.guestIds, id],
        // guest list changed → any saved seating is stale
        seating: null,
      };
    });
  };

  const save = () => {
    const today = new Date().toISOString().slice(0, 10);
    onSave({ ...form, status: form.date && form.date <= today ? "past" : "upcoming" });
    onClose();
  };

  return (
    <Modal
      title={editing ? "Edit table" : "New table"}
      subtitle={`${form.guestIds.length}/${form.seats} seats filled`}
      onClose={onClose}
      wide
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        <div className="col-span-2">
          <label className={labelCls}>Name</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Second-time founders"
          />
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <input
            type="date"
            className={inputCls}
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Venue</label>
          <input
            className={inputCls}
            value={form.venue}
            onChange={(e) => set("venue", e.target.value)}
            placeholder="TBD"
          />
        </div>
        <div>
          <label className={labelCls}>Seats</label>
          <input
            type="number"
            min={2}
            max={20}
            className={inputCls}
            value={form.seats}
            onChange={(e) => set("seats", Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelCls}>Co-host</label>
          <select
            className={inputCls}
            value={form.coHost ?? ""}
            onChange={(e) => set("coHost", e.target.value || null)}
          >
            <option value="">None</option>
            {guests.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Guest list</label>
          <div className="border border-line rounded-none max-h-48 overflow-y-auto divide-y divide-line mt-1">
            {guests.map((g) => (
              <label
                key={g.id}
                className="flex items-center gap-3 px-3 py-2.5 text-[14.5px] cursor-pointer hover:bg-tile transition-colors"
              >
                <input
                  type="checkbox"
                  checked={form.guestIds.includes(g.id)}
                  onChange={() => toggleGuest(g.id)}
                />
                <span className="flex-1 text-text">{g.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  {g.company}
                </span>
                <RoleBadge role={g.role} />
              </label>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Note</label>
          <input
            className={inputCls}
            value={form.note ?? ""}
            onChange={(e) => set("note", e.target.value || null)}
            placeholder="What this table is for"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-10">
        <div className="flex-1">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
        <PrimaryButton disabled={!form.name.trim() || !form.date} onClick={save}>
          {editing ? "Save" : "Create table"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
