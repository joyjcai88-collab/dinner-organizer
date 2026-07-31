"use client";

import { Guest } from "@/lib/types";

const MONO =
  "var(--font-ibm-plex-mono), 'SF Mono', SFMono-Regular, Menlo, Monaco, monospace";
const SERIF = "Georgia, 'Times New Roman', Times, serif";

const ROLE_SEAT: Record<
  Guest["role"],
  { fill: string; text: string; stroke: string }
> = {
  founder: { fill: "#000000", text: "#FFFFFF", stroke: "none" },
  vc: { fill: "#00949F", text: "#FFFFFF", stroke: "none" },
  engineer: { fill: "#757575", text: "#FFFFFF", stroke: "none" },
  operator: { fill: "#E6E6E6", text: "#000000", stroke: "none" },
  other: { fill: "#FFFFFF", text: "#757575", stroke: "#E6E6E6" },
};

/** Guests in `order`, clockwise around an oval table. */
export default function SeatingChart({ order }: { order: Guest[] }) {
  const n = order.length;
  if (n === 0) return null;

  const W = 680;
  const H = 380;
  const cx = W / 2;
  const cy = H / 2;
  const rx = 240;
  const ry = 115;

  const seats = order.map((guest, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const cos = Math.cos(angle);
    const x = cx + rx * cos;
    const y = cy + ry * Math.sin(angle);
    // push the label away from the table, and anchor it outward on the
    // left/right flanks so long names don't run back into the seat circle
    const anchor: "start" | "end" | "middle" =
      cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
    const lx = cx + (rx + (anchor === "middle" ? 0 : 24)) * cos;
    const ly = cy + (ry + 40) * Math.sin(angle);
    return { guest, x, y, lx, ly, anchor };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl mx-auto">
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx - 34}
        ry={ry - 34}
        fill="#F5F5F5"
        stroke="#E6E6E6"
        strokeWidth="1"
      />
      {seats.map(({ guest, x, y, lx, ly, anchor }) => {
        const [first, ...rest] = guest.name.split(" ");
        const seat = ROLE_SEAT[guest.role];
        return (
          <g key={guest.id}>
            <circle
              cx={x}
              cy={y}
              r="15"
              fill={seat.fill}
              stroke={seat.stroke}
              strokeWidth="1"
            />
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              fill={seat.text}
              fontSize="10.5"
              fontFamily={MONO}
            >
              {first[0]}
              {rest.length > 0 ? rest[rest.length - 1][0] : ""}
            </text>
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              fill="#000000"
              fontSize="13"
              fontFamily={SERIF}
            >
              {first}
            </text>
            <text
              x={lx}
              y={ly + 14}
              textAnchor={anchor}
              fill="#A3A3A3"
              fontSize="9.5"
              fontFamily={MONO}
            >
              {guest.company}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
