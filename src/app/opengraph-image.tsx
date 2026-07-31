import { ImageResponse } from "next/og";

export const alt = "Covers · Be My Dinner Guest";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFFFFF",
          color: "#000000",
          padding: 80,
        }}
      >
        <svg
          width="72"
          height="72"
          viewBox="0 0 26 26"
          fill="none"
          stroke="#000000"
          strokeWidth="1.6"
        >
          <path d="M4 22 L4 4 L22 13 Z" />
          <path d="M8 18.5 L8 7.5 L18.5 13 Z" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 110, lineHeight: 1, letterSpacing: "-0.025em" }}>
            Covers
          </div>
          <div style={{ fontSize: 40, marginTop: 28, color: "#757575" }}>
            Be My Dinner Guest.
          </div>
        </div>
        <div style={{ fontSize: 26, color: "#A3A3A3" }}>
          Who sat where, who hit it off, and who you owe a follow-up.
        </div>
      </div>
    ),
    { ...size }
  );
}
