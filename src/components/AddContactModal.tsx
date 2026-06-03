"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Contact, ContactRole } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
}

const ROLES: ContactRole[] = ["founder", "engineer", "vc", "operator", "other"];

export default function AddContactModal({ open, onClose, onSave }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<ContactRole>("founder");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  if (!open) return null;

  const handleSave = () => {
    const contact: Contact = {
      id: uuid(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      company: company.trim(),
      title: title.trim(),
      email: email.trim(),
      linkedinUrl: linkedinUrl.trim(),
      tags: [],
      notes: "",
      eventsAttended: 0,
      lastEventDate: null,
      createdAt: new Date().toISOString(),
    };
    onSave(contact);
    setFirstName("");
    setLastName("");
    setRole("founder");
    setCompany("");
    setTitle("");
    setEmail("");
    setLinkedinUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-hf-border max-w-md w-full p-8">
        <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-hf-text mb-1">
          Add Contact
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-6">
          New dinner guest
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 border border-hf-border rounded-none bg-white focus:ring-2 focus:ring-hf-gold focus:border-hf-gold text-hf-text text-sm"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 border border-hf-border rounded-none bg-white focus:ring-2 focus:ring-hf-gold focus:border-hf-gold text-hf-text text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ContactRole)}
              className="w-full px-3 py-2.5 border border-hf-border rounded-none bg-white focus:ring-2 focus:ring-hf-gold focus:border-hf-gold text-hf-text text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-1.5">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2.5 border border-hf-border rounded-none bg-white focus:ring-2 focus:ring-hf-gold focus:border-hf-gold text-hf-text text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-hf-border rounded-none bg-white focus:ring-2 focus:ring-hf-gold focus:border-hf-gold text-hf-text text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-hf-border rounded-none bg-white focus:ring-2 focus:ring-hf-gold focus:border-hf-gold text-hf-text text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-hf-muted mb-1.5">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full px-3 py-2.5 border border-hf-border rounded-none bg-white focus:ring-2 focus:ring-hf-gold focus:border-hf-gold text-hf-text text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-hf-border text-hf-text font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!firstName.trim()}
            className="relative flex-1 px-4 py-2.5 bg-hf-dark text-white font-mono text-xs uppercase tracking-[0.15em] hover:bg-hf-dark/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add Contact
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-hf-gold" />
          </button>
        </div>
      </div>
    </div>
  );
}
