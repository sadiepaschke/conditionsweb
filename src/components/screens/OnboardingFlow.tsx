import { useState } from "react";
import { THEME } from "../../constants/theme";
import type { WebMetadata, OntologicalFrame } from "../../types/onboarding";

interface OnboardingFlowProps {
  onComplete: (metadata: WebMetadata) => void;
  dark: boolean;
}

const ONTOLOGICAL_OPTIONS: { value: OntologicalFrame; label: string; description: string }[] = [
  {
    value: "human_systems",
    label: "Human systems",
    description: "We work primarily within policies, institutions, markets, and social services.",
  },
  {
    value: "ecological_relational",
    label: "Ecological relationships",
    description: "Our work is rooted in land, water, food systems, and environmental stewardship.",
  },
  {
    value: "spiritual_ceremonial",
    label: "Spiritual or ceremonial practice",
    description: "Our work is grounded in spiritual practice, ceremony, or ancestral relationships.",
  },
  {
    value: "mixed",
    label: "A mix of these",
    description: "Our work spans multiple frames — we'll let the conversation show which ones matter most.",
  },
];

export default function OnboardingFlow({ onComplete, dark }: OnboardingFlowProps) {
  const t = dark ? THEME.dark : THEME.light;
  const [step, setStep] = useState(0);
  const [metadata, setMetadata] = useState<WebMetadata>({
    org_name: "",
    program_name: "",
    target_population: "",
    geography: "",
    sector: "",
    ontological_frame: "human_systems",
  });

  const update = (field: keyof WebMetadata, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const canAdvance = () => {
    if (step === 0) return metadata.org_name.trim() && metadata.program_name.trim();
    if (step === 1) return metadata.target_population.trim();
    if (step === 2) return true; // ontological frame always has a default
    return false;
  };

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else onComplete(metadata);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canAdvance()) {
      e.preventDefault();
      handleNext();
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", fontSize: 14,
    background: t.surface, border: `1px solid ${t.border}`,
    borderRadius: 10, color: t.text,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none", marginBottom: 16,
    transition: "all 0.3s",
  };

  const labelStyle = {
    display: "block" as const, fontSize: 13, color: t.textMuted,
    marginBottom: 6, fontWeight: 400,
  };

  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 48, position: "relative",
    }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 400, height: 400, borderRadius: "50%",
        background: `radial-gradient(circle, ${t.gold}08 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        maxWidth: 440, width: "100%", position: "relative", zIndex: 1,
      }}>
        {/* Step indicator */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 32, justifyContent: "center",
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 32, height: 3, borderRadius: 2,
              background: i <= step ? t.gold : t.border,
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {step === 0 && (
          <div style={{ animation: "fadeUp 0.3s ease-out" }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 26, color: t.text, marginBottom: 8,
              textAlign: "center",
            }}>
              Tell us about your organization
            </h2>
            <p style={{
              fontSize: 14, color: t.textMuted, marginBottom: 28,
              textAlign: "center", lineHeight: 1.6,
            }}>
              This helps us tailor the conversation to your context.
            </p>

            <label style={labelStyle}>Organization name</label>
            <input
              value={metadata.org_name}
              onChange={e => update("org_name", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Greenway Community Services"
              style={inputStyle}
              autoFocus
            />

            <label style={labelStyle}>Program name</label>
            <input
              value={metadata.program_name}
              onChange={e => update("program_name", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Youth Transition Program"
              style={inputStyle}
            />

            <label style={labelStyle}>Geography</label>
            <input
              value={metadata.geography}
              onChange={e => update("geography", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Minneapolis metro area"
              style={inputStyle}
            />

            <label style={labelStyle}>Sector (optional)</label>
            <input
              value={metadata.sector}
              onChange={e => update("sector", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Housing, Youth development"
              style={inputStyle}
            />
          </div>
        )}

        {step === 1 && (
          <div style={{ animation: "fadeUp 0.3s ease-out" }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 26, color: t.text, marginBottom: 8,
              textAlign: "center",
            }}>
              Who does your program serve?
            </h2>
            <p style={{
              fontSize: 14, color: t.textMuted, marginBottom: 28,
              textAlign: "center", lineHeight: 1.6,
            }}>
              Describe the people at the center of your work.
            </p>

            <label style={labelStyle}>Target population</label>
            <textarea
              value={metadata.target_population}
              onChange={e => update("target_population", e.target.value)}
              placeholder="e.g. Young adults ages 18-24 transitioning out of foster care in the Twin Cities"
              rows={4}
              style={{
                ...inputStyle,
                resize: "none" as const,
                lineHeight: 1.6,
                minHeight: 100,
              }}
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "fadeUp 0.3s ease-out" }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 26, color: t.text, marginBottom: 8,
              textAlign: "center",
            }}>
              What is your work rooted in?
            </h2>
            <p style={{
              fontSize: 14, color: t.textMuted, marginBottom: 28,
              textAlign: "center", lineHeight: 1.6,
            }}>
              This shapes how we explore conditions together.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ONTOLOGICAL_OPTIONS.map(opt => {
                const selected = metadata.ontological_frame === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => update("ontological_frame", opt.value)}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 10,
                      border: `1px solid ${selected ? t.borderAccent : t.border}`,
                      background: selected ? `${t.gold}10` : "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      fontSize: 14, fontWeight: 500, color: t.text,
                      marginBottom: 3,
                    }}>
                      {opt.label}
                    </div>
                    <div style={{
                      fontSize: 12, color: t.textMuted, lineHeight: 1.5,
                    }}>
                      {opt.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginTop: 28,
        }}>
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: "10px 20px", fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                background: "transparent", border: "none",
                color: t.textMuted, cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            style={{
              padding: "12px 28px", fontSize: 14, fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              background: "transparent",
              border: `1px solid ${t.borderAccent}`,
              color: t.gold, borderRadius: 10,
              cursor: canAdvance() ? "pointer" : "not-allowed",
              opacity: canAdvance() ? 1 : 0.4,
              transition: "all 0.25s",
            }}
          >
            {step === 2 ? "Begin the conversation" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
