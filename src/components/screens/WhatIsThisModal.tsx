import { useEffect } from "react";
import { THEME } from "../../constants/theme";

interface WhatIsThisModalProps {
  onClose: () => void;
  dark: boolean;
}

export default function WhatIsThisModal({ onClose, dark }: WhatIsThisModalProps) {
  const t = dark ? THEME.dark : THEME.light;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const cards = [
    {
      icon: "?",
      title: "What is a Conditions Web?",
      body: "A map of everything that shapes whether change happens — what your program creates, what others contribute, and what the broader environment provides or withholds.",
    },
    {
      icon: "↔",
      title: "Why mutual causality?",
      body: "Change happens when the right conditions come together, not because a program caused it. Seeing how conditions interact helps you know what to strengthen.",
    },
    {
      icon: "≠",
      title: "How is it different?",
      body: "Your program enters a situation that already exists. This conversation maps that full picture, with your program as one part of it — not the center.",
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.surface, borderRadius: 16,
          maxWidth: 700, width: "100%", padding: "36px 32px 32px",
          position: "relative", border: `1px solid ${t.border}`,
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 20,
            background: "none", border: "none",
            color: t.textDim, fontSize: 22, cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16, marginBottom: 24,
        }}>
          {cards.map((card, i) => (
            <div key={i} style={{
              background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              borderRadius: 12, padding: "24px 20px",
              border: `1px solid ${t.border}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #cbb26a, #c99d28)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, color: "#fff", fontWeight: 600,
                marginBottom: 14,
              }}>
                {card.icon}
              </div>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 15, color: t.text, marginBottom: 8,
              }}>
                {card.title}
              </h3>
              <p style={{
                fontSize: 13, lineHeight: 1.6, color: t.textMuted,
              }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "16px 18px", borderRadius: 10,
          background: dark ? "rgba(203,178,106,0.06)" : "rgba(120,95,30,0.05)",
          border: `1px solid ${t.border}`,
        }}>
          <span style={{
            background: "linear-gradient(135deg, #cbb26a, #c99d28)",
            color: "#fff", fontSize: 10, fontWeight: 700,
            padding: "3px 7px", borderRadius: 4,
            flexShrink: 0, marginTop: 2,
          }}>
            AI
          </span>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: t.textMuted }}>
            This conversation draws out what you already know. There are no right
            answers — talk the way you'd talk to a thoughtful colleague. The map is yours.
          </p>
        </div>
      </div>
    </div>
  );
}
