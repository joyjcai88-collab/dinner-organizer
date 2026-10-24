"use client";

// Site chrome shared with joyjcai.com: header with Menu [M], the bottom bar, Find [F] and the
// Pacific clock. Styles live in site-chrome.css. Number keys don't jump to other pages here,
// so a stray key never leaves work in progress.

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

const SITE = "https://joyjcai.com";
const icon16 = (d: string) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">${d}</svg>`;
const PUPPY =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9C7 5.6 9.4 4 12 4s5 1.6 5 5v4c0 4-2.4 6.5-5 6.5S7 17 7 13Z"/><path d="M7.2 7.8C4.6 7.4 3 9.6 3.5 13c.3 2 1.9 2.2 3.5.6"/><path d="M16.8 7.8c2.6-.4 4.2 1.8 3.7 5.2-.3 2-1.9 2.2-3.5.6"/><circle cx="10" cy="11" r=".8" fill="currentColor" stroke="none"/><circle cx="14" cy="11" r=".8" fill="currentColor" stroke="none"/><path d="M11 14.4h2l-1 1.2Z" fill="currentColor"/></svg>';

const PAGES = [
  { t: "Home", url: `${SITE}/`, icon: icon16('<path d="M2.5 7.5 8 3l5.5 4.5V13h-11z"/><path d="M6.5 13V9.5h3V13"/>'), text: "bio about joy cai" },
  { t: "Experience", url: `${SITE}/experience`, icon: icon16('<rect x="2" y="5" width="12" height="8"/><path d="M6 5V3h4v2M2 9h12"/>'), text: "experience log resume roles work history education" },
  { t: "Advisory", url: `${SITE}/advisory`, icon: icon16('<rect x="2.5" y="2.5" width="4.5" height="4.5"/><rect x="9" y="2.5" width="4.5" height="4.5"/><rect x="2.5" y="9" width="4.5" height="4.5"/><rect x="9" y="9" width="4.5" height="4.5"/>'), text: "advisory advisor companies portfolio" },
  { t: "Tools", url: `${SITE}/tools`, icon: icon16('<path d="M5.5 2.5 2.5 5.5l3 3M10.5 7.5l3 3-3 3M9.5 2.5l-3 11"/>'), text: "tools projects built founders investors" },
  { t: "Blog", url: `${SITE}/blog`, icon: icon16('<path d="M11 2.5l2.5 2.5L6 12.5H3.5V10z"/><path d="M9.5 4l2.5 2.5"/>'), text: "blog writing posts deep dives pitch notes" },
  { t: "Adopt Don't Shop", url: `${SITE}/adoptdontshop`, icon: PUPPY, text: "adopt dont shop pets dogs cats rabbits shelters rescues animals luke" },
  { t: "Contact", url: `${SITE}/contact`, icon: icon16('<rect x="2" y="3.5" width="12" height="9"/><path d="M2 4l6 5 6-5"/>'), text: "contact email message form consulting" },
];
type Item = { t: string; type: string; url: string; text?: string; newTab?: boolean };
const INDEX: Item[] = [
  ...PAGES.map((p) => ({ t: p.t, type: "PAGE", url: p.url, text: p.text })),
  { t: "North Court", type: "SERVICE", url: "https://www.northcourtcapital.com/", newTab: true },
  { t: "Flagler Health", type: "COMPANY", url: "https://www.flaglerhealth.io/", newTab: true },
  { t: "Quina Health", type: "COMPANY", url: "https://quinahealth-archive.joyjcai.com/", newTab: true },
  { t: "Solis Health", type: "COMPANY", url: "https://solishealthwellness-archive.webflow.io/", newTab: true },
  { t: "Hustle Fund", type: "COMPANY", url: "https://www.hustlefund.vc/", newTab: true },
  { t: "LinkedIn", type: "LINK", url: "https://www.linkedin.com/in/joycai12/", newTab: true },
];

function search(q: string): Item[] {
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return INDEX.filter((i) => i.type === "PAGE" || i.t === "North Court");
  // every word must appear somewhere; title matches rank above content matches
  const score = (i: Item) => {
    const title = i.t.toLowerCase();
    const hay = `${title} ${i.type.toLowerCase()} ${(i.text || "").toLowerCase()}`;
    if (!terms.every((w) => hay.includes(w))) return -1;
    return terms.every((w) => title.includes(w)) ? (title.startsWith(terms[0]) ? 3 : 2) : 1;
  };
  return INDEX.map((i) => [i, score(i)] as const)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([i]) => i);
}

export default function SiteChrome({ name, home = "/" }: { name: string; home?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const [clock, setClock] = useState("");
  const menuBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const findInput = useRef<HTMLInputElement>(null);
  const results = useMemo(() => search(query), [query]);

  useEffect(() => {
    const tick = () =>
      setClock(`(PT) ${new Date().toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit", second: "2-digit" })}`);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const openFind = () => {
    setQuery("");
    setSel(0);
    setFindOpen(true);
    setTimeout(() => findInput.current?.focus(), 50);
  };
  const pick = (item: Item) => {
    setFindOpen(false);
    if (item.newTab) window.open(item.url, "_blank", "noopener");
    else window.location.href = item.url;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (findOpen) {
        if (k === "escape") setFindOpen(false);
        return;
      }
      if (menuOpen) {
        if (k === "escape" || k === "m") {
          setMenuOpen(false);
          menuBtn.current?.focus();
        }
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable], [role=dialog]")) return;
      if (k === "m") {
        setMenuOpen(true);
        setTimeout(() => closeBtn.current?.focus(), 0);
      } else if (k === "f") {
        e.preventDefault();
        openFind();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [findOpen, menuOpen]);

  return (
    <>
      <header className="sc-header">
        <a className="sc-mark" href={SITE} aria-label="Joy Cai home">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <text x="13" y="19" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', Times, serif" fontSize="18" letterSpacing="-1.2">
              <tspan fill="currentColor">J</tspan>
              <tspan fill="#00b6c4">C</tspan>
            </text>
          </svg>
        </a>
        <div className="sc-word">
          <a href={SITE}>Joy&nbsp;Cai</a>
          <span className="sc-slash">&thinsp;/&thinsp;</span>
          <a href={home}>{name}</a>
        </div>
        <button
          ref={menuBtn}
          type="button"
          className="sc-pill sc-menu-btn"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen(true);
            setTimeout(() => closeBtn.current?.focus(), 0);
          }}
        >
          Menu<span className="sc-key-hint">&nbsp;[M]</span>
        </button>
      </header>

      <div className={`sc-menu${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen} onClick={(e) => e.target === e.currentTarget && setMenuOpen(false)}>
        <button ref={closeBtn} type="button" className="sc-pill sc-menu-close" aria-label="Close menu" onClick={() => { setMenuOpen(false); menuBtn.current?.focus(); }}>
          &times;
        </button>
        <nav className="sc-menu-nav" aria-label="joyjcai.com">
          {PAGES.map((p) => (
            <a key={p.t} href={p.url}>{p.t}</a>
          ))}
          <div className="sc-menu-sub">
            <a href="https://www.linkedin.com/in/joycai12/" target="_blank" rel="noopener">LinkedIn ↗</a>
          </div>
        </nav>
      </div>

      <nav className="sc-pages" aria-label="joyjcai.com pages">
        {PAGES.map((p) => (
          <a key={p.t} href={p.url} aria-label={p.t}>
            <span className="sc-pg-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: p.icon }} />
            <span className="sc-pg-name">{p.t}</span>
          </a>
        ))}
      </nav>
      <button type="button" className="sc-pill sc-find-btn" onClick={openFind}>
        Find<span className="sc-key-hint">&nbsp;[F]</span>
      </button>
      <div className="sc-clock" suppressHydrationWarning>{clock}</div>
      <Script src="/luke.js?v=4" data-spot="menu" strategy="afterInteractive" />

      <div className={`sc-find${findOpen ? " is-open" : ""}`} aria-hidden={!findOpen} onClick={(e) => e.target === e.currentTarget && setFindOpen(false)}>
        <div className="sc-find-panel" role="dialog" aria-label="Find on joyjcai.com">
          <input
            ref={findInput}
            className="sc-find-input"
            type="text"
            placeholder="Type to search…"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search joyjcai.com"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSel(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
              else if (e.key === "Enter" && results[sel]) pick(results[sel]);
            }}
          />
          <ul className="sc-find-results" role="listbox">
            {results.length ? (
              results.map((r, i) => (
                <li key={r.t} role="option" aria-selected={i === sel} className={i === sel ? "is-sel" : ""} onMouseMove={() => setSel(i)} onClick={() => pick(r)}>
                  <span>{r.t}</span>
                  <span className="sc-fr-type">{r.type}</span>
                </li>
              ))
            ) : (
              <li className="sc-find-empty">NO RESULTS</li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
