"use client";

// A drop-in for <select> with the same custom menu as joyjcai.com/adoptdontshop. It takes the
// same value, onChange and <option> children, and calls onChange with { target: { value } },
// so existing handlers that read e.target.value keep working. Styles are in site-chrome.css.

import { Children, isValidElement, ReactNode, useEffect, useId, useRef, useState } from "react";

type Opt = { value: string; label: string; disabled: boolean };
type ChangeLike = { target: { value: string } };

function text(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return text(node.props.children);
  return "";
}

function collect(children: ReactNode, out: Opt[] = []): Opt[] {
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)) return;
    if (child.type === "option") {
      const label = text(child.props.children);
      out.push({ value: String(child.props.value ?? label), label, disabled: !!child.props.disabled });
    } else if (child.props.children) {
      collect(child.props.children, out); // fragments and groups
    }
  });
  return out;
}

export default function Select({
  value,
  onChange,
  children,
  className = "",
  "aria-label": ariaLabel,
  disabled = false,
}: {
  value: string | number | null | undefined;
  onChange: (e: ChangeLike) => void;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}) {
  const options = collect(children);
  const current = String(value ?? "");
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === current));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const [place, setPlace] = useState({ up: false, right: false });
  const wrap = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Open toward whichever side keeps the menu on screen and clear of the bottom bar.
  useEffect(() => {
    if (!open || !menu.current || !wrap.current) return;
    const r = menu.current.getBoundingClientRect();
    const w = wrap.current.getBoundingClientRect();
    setPlace({
      up: r.bottom > innerHeight - 72 && w.top > innerHeight - w.bottom,
      right: r.right > document.documentElement.clientWidth - 8,
    });
    menu.current.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = (from: number, dir: number) => {
    let i = from;
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) return i;
    }
    return from;
  };
  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    setOpen(false);
    btn.current?.focus();
    if (o.value !== current) onChange({ target: { value: o.value } });
  };
  const show = () => {
    setActive(selectedIndex);
    setPlace({ up: false, right: false });
    setOpen(true);
  };

  return (
    // The page's own field class would add a second underline; only its width choice is kept.
    <div ref={wrap} className={`sc-dd${open ? " open" : ""}`} style={className.includes("w-auto") ? { width: "auto" } : undefined}>
      <button
        ref={btn}
        type="button"
        className="sc-dd-btn"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) return show();
            setActive((a) => step(a, e.key === "ArrowDown" ? 1 : -1));
          } else if ((e.key === "Enter" || e.key === " ") && open) {
            e.preventDefault();
            choose(active);
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          } else if (e.key === "Tab") {
            setOpen(false);
          } else if (e.key.length === 1 && /\S/.test(e.key)) {
            // Jump to the next option starting with the typed letter.
            e.stopPropagation();
            if (!open) show();
            const k = e.key.toLowerCase();
            for (let n = 1; n <= options.length; n++) {
              const i = (active + n) % options.length;
              if (!options[i].disabled && options[i].label.trim().toLowerCase().startsWith(k)) {
                setActive(i);
                break;
              }
            }
          }
        }}
      >
        <span className="sc-dd-label">{options[selectedIndex]?.label ?? ""}</span>
      </button>
      {open && (
        <ul ref={menu} id={`${id}-menu`} role="listbox" className={`sc-dd-menu${place.up ? " up" : ""}${place.right ? " right" : ""}`} onMouseDown={(e) => e.preventDefault()}>
          {options.map((o, i) => (
            <li
              key={`${o.value}-${i}`}
              role="option"
              aria-selected={o.value === current}
              aria-disabled={o.disabled || undefined}
              className={[o.value === current && "on", i === active && "active", o.disabled && "off"].filter(Boolean).join(" ")}
              onMouseMove={() => !o.disabled && setActive(i)}
              onClick={() => choose(i)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
