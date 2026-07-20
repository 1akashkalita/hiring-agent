import { ImageResponse } from "next/og";

// Required so the image is baked at build time under `output: export`.
export const dynamic = "force-static";

export const alt = "Fix My Resume — an honest, in-browser resume score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Static social-card image, generated at build time (the app is a static export).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F7F9F6",
          padding: "72px 80px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 8,
              background: "#174C3C",
              color: "#fff",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            F
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 22,
              fontSize: 26,
              letterSpacing: "2px",
              color: "#66736D",
              fontFamily: "monospace",
            }}
          >
            LOCAL PDF · DIRECT GEMINI · 100-POINT RUBRIC
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#18302A", lineHeight: 1.05 }}>
            Fix My&nbsp;<span style={{ color: "#174C3C" }}>Resume</span>
          </div>
          <div style={{ fontSize: 34, color: "#66736D", marginTop: 18, maxWidth: 930 }}>
            An explainable resume score out of 100, prioritized coaching, and revision tracking.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 24, color: "#2F6B57" }}>
            <div
              style={{ width: 14, height: 14, borderRadius: 999, background: "#2F6B57", marginRight: 12 }}
            />
            PDF stays local · text goes directly to Gemini
          </div>
          <div style={{ fontSize: 26, color: "#174C3C", fontFamily: "monospace" }}>fixmyresume.dev</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
