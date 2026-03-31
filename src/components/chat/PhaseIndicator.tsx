import type { ThemeTokens } from "../../types";

const ORG_PHASES = [
  { label: "Situational" },
  { label: "Population" },
  { label: "Organizational" },
  { label: "Market" },
  { label: "Structural" },
  { label: "Historical" },
  { label: "Community" },
  { label: "Ecological" },
];

const PROGRAM_PHASES = [
  { label: "Historical" },
  { label: "Situational" },
  { label: "Population" },
  { label: "Community" },
  { label: "Structural" },
  { label: "Organizational" },
  { label: "Market" },
  { label: "Ecological" },
  { label: "What You Bring" },
  { label: "Risks & Gaps" },
];

interface PhaseIndicatorProps {
  t: ThemeTokens;
  messageCount: number;
  layer: "organizational" | "program";
}

function estimateOrgPhase(messageCount: number): number {
  // ~3 messages per domain, 8 domains
  return Math.min(Math.floor(messageCount / 3), ORG_PHASES.length - 1);
}

function estimateProgramPhase(messageCount: number): number {
  // ~3 messages per domain, 10 phases
  return Math.min(Math.floor(messageCount / 3), PROGRAM_PHASES.length - 1);
}

export default function PhaseIndicator({ t, messageCount, layer }: PhaseIndicatorProps) {
  const phases = layer === "organizational" ? ORG_PHASES : PROGRAM_PHASES;
  const currentPhase = layer === "organizational"
    ? estimateOrgPhase(messageCount)
    : estimateProgramPhase(messageCount);

  const layerLabel = layer === "organizational" ? "Org Web" : "Program Web";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "8px 32px",
      borderBottom: `1px solid ${t.border}`,
      fontSize: 11,
    }}>
      <span style={{
        color: t.gold, fontWeight: 500, letterSpacing: "0.04em",
        fontSize: 10, padding: "2px 8px", borderRadius: 4,
        border: `1px solid ${t.borderAccent}`,
      }}>
        {layerLabel}
      </span>
      <div style={{ display: "flex", gap: 3, flex: 1 }}>
        {phases.map((phase, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= currentPhase ? t.gold : t.border,
              transition: "background 0.4s",
            }}
            title={phase.label}
          />
        ))}
      </div>
      <span style={{ color: t.textMuted, fontSize: 10 }}>
        {phases[currentPhase]?.label}
      </span>
    </div>
  );
}
