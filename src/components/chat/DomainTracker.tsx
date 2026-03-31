import { DOMAIN_LABELS, NODE_COLORS } from "../../constants/domains";
import type { ThemeTokens, Domain, ConditionNode } from "../../types";
import type { WebScope } from "../../types/onboarding";
import { ORG_DOMAINS, PROGRAM_DOMAINS } from "../../types/onboarding";

interface DomainTrackerProps {
  t: ThemeTokens;
  scope: WebScope;
  conditions: ConditionNode[];
}

export default function DomainTracker({ t, scope, conditions }: DomainTrackerProps) {
  const domainOrder = scope === "organizational" ? ORG_DOMAINS : PROGRAM_DOMAINS;

  // Count conditions per domain
  const counts: Record<string, number> = {};
  for (const c of conditions) {
    counts[c.domain] = (counts[c.domain] || 0) + 1;
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "8px 32px",
      borderBottom: `1px solid ${t.border}`,
      fontSize: 10,
      overflowX: "auto",
    }}>
      <span style={{
        color: t.gold, fontWeight: 500, letterSpacing: "0.04em",
        fontSize: 9, padding: "2px 7px", borderRadius: 4,
        border: `1px solid ${t.borderAccent}`,
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        {scope === "organizational" ? "Org Web" : "Program Web"}
      </span>
      {domainOrder.map(domain => {
        const count = counts[domain] || 0;
        const done = count >= 2;
        const started = count > 0;
        return (
          <div
            key={domain}
            title={`${DOMAIN_LABELS[domain as Domain]}: ${count} conditions`}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 10,
              background: done ? `${NODE_COLORS[domain as Domain].bg}15` : "transparent",
              border: `1px solid ${done ? NODE_COLORS[domain as Domain].bg + "40" : started ? t.border : "transparent"}`,
              transition: "all 0.3s",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: NODE_COLORS[domain as Domain].bg,
              opacity: started ? 1 : 0.3,
            }} />
            <span style={{
              color: done ? t.textMuted : started ? t.textDim : `${t.textDim}80`,
              fontSize: 9,
            }}>
              {DOMAIN_LABELS[domain as Domain].split(" ")[0]}
            </span>
            {count > 0 && (
              <span style={{
                color: t.textDim, fontSize: 8,
              }}>
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
