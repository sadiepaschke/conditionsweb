import type { ThemeTokens, ConditionNode } from "../../types";

interface CrossWebIndicatorProps {
  t: ThemeTokens;
  orgConditions: ConditionNode[];
  programConditions: ConditionNode[];
}

export default function CrossWebIndicator({ t, orgConditions, programConditions }: CrossWebIndicatorProps) {
  if (!orgConditions.length || !programConditions.length) return null;

  // Find program conditions that are program contributions — these link to the org web
  const programContributions = programConditions.filter(c => c.is_program_contribution);

  return (
    <div style={{
      padding: "8px 24px",
      borderTop: `1px solid ${t.border}`,
      fontSize: 10, color: t.textDim,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{
          width: 12, height: 1,
          background: `linear-gradient(90deg, ${t.gold}, transparent)`,
        }} />
        <span style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Cross-web links
        </span>
      </div>
      <div style={{ color: t.textMuted, lineHeight: 1.5 }}>
        {orgConditions.length} org conditions · {programContributions.length} program contributions
        {programContributions.length > 0 && (
          <span style={{ color: t.gold }}> — these connect the two webs</span>
        )}
      </div>
    </div>
  );
}
