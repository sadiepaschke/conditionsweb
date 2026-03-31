import { NODE_COLORS, DOMAIN_LABELS } from "../../constants/domains";
import type { ThemeTokens, Domain } from "../../types";

interface WebLegendProps {
  t: ThemeTokens;
  filteredDomains?: Set<Domain>;
  onToggleDomain?: (domain: Domain) => void;
  subpopulations?: string[];
  selectedSubpop?: string | null;
  onSelectSubpop?: (subpop: string | null) => void;
}

export default function WebLegend({
  t,
  filteredDomains,
  onToggleDomain,
  subpopulations,
  selectedSubpop,
  onSelectSubpop,
}: WebLegendProps) {
  return (
    <div style={{
      padding: "16px 24px 12px",
      borderBottom: `1px solid ${t.border}`,
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: 11, textTransform: "uppercase",
        letterSpacing: "0.12em", color: t.textDim,
        marginBottom: 10,
      }}>
        Conditions Web — emerging
      </div>

      {/* Domain filter legend */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8,
      }}>
        {(Object.keys(NODE_COLORS) as Domain[]).map(domain => {
          const isActive = !filteredDomains || filteredDomains.has(domain);
          return (
            <div
              key={domain}
              onClick={() => onToggleDomain?.(domain)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 10,
                color: isActive ? t.textDim : `${t.textDim}40`,
                cursor: onToggleDomain ? "pointer" : "default",
                transition: "all 0.2s",
                opacity: isActive ? 1 : 0.35,
              }}
            >
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: NODE_COLORS[domain].bg,
                transition: "opacity 0.2s",
              }} />
              <span>{DOMAIN_LABELS[domain]}</span>
            </div>
          );
        })}
      </div>

      {/* Subpopulation filter */}
      {subpopulations && subpopulations.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6,
          marginTop: 10,
          paddingTop: 8,
          borderTop: `1px solid ${t.border}`,
        }}>
          <div
            onClick={() => onSelectSubpop?.(null)}
            style={{
              fontSize: 9, padding: "2px 8px", borderRadius: 10,
              background: !selectedSubpop ? `${t.gold}20` : "transparent",
              border: `1px solid ${!selectedSubpop ? t.borderAccent : t.border}`,
              color: !selectedSubpop ? t.gold : t.textDim,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            All
          </div>
          {subpopulations.map(sp => (
            <div
              key={sp}
              onClick={() => onSelectSubpop?.(sp)}
              style={{
                fontSize: 9, padding: "2px 8px", borderRadius: 10,
                background: selectedSubpop === sp ? `${t.gold}20` : "transparent",
                border: `1px solid ${selectedSubpop === sp ? t.borderAccent : t.border}`,
                color: selectedSubpop === sp ? t.gold : t.textDim,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {sp}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
