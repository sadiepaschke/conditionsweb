import { useState, useCallback } from "react";
import Markdown from "react-markdown";
import { downloadAsWord } from "../../utils/downloadWord";
import LogicModelDiagram from "./LogicModelDiagram";
import type { ThemeTokens, ConditionNode, Edge } from "../../types";

type DeliverableType = "narrative" | "toc" | "logic-model" | "checklist";

interface DeliverablePanelProps {
  nodes: ConditionNode[];
  edges: Edge[];
  webId: string | null;
  t: ThemeTokens;
  dark: boolean;
  onClose: () => void;
  analysisText?: string | null;
}

const TABS: { key: DeliverableType; label: string }[] = [
  { key: "narrative", label: "Situational Analysis" },
  { key: "toc", label: "Conditions Web" },
  { key: "logic-model", label: "Logic Model" },
  { key: "checklist", label: "Review Checklist" },
];

function downloadWebAsPng(dark: boolean) {
  const svg = document.querySelector("svg");
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", "100%");
  bg.setAttribute("height", "100%");
  bg.setAttribute("fill", dark ? "#0e0d0a" : "#faf8f2");
  clone.insertBefore(bg, clone.firstChild);
  const data = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    const a = document.createElement("a");
    a.download = "conditions-web.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
}

export default function DeliverablePanel({ nodes, edges, webId, t, dark, onClose, analysisText }: DeliverablePanelProps) {
  const [activeTab, setActiveTab] = useState<DeliverableType>("narrative");
  const [content, setContent] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reviewChecks, setReviewChecks] = useState<Record<string, boolean>>({});

  const generate = useCallback(async (type: DeliverableType) => {
    if (content[type]) return;
    setLoading(prev => ({ ...prev, [type]: true }));
    setErrors(prev => ({ ...prev, [type]: "" }));

    try {
      const res = await fetch("/.netlify/functions/deliverable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          conditions: nodes.map(n => ({
            id: n.id, label: n.label, name: n.label, domain: n.domain,
            is_program_contribution: n.is_program_contribution || false,
            subpopulation: n.subpopulation || [],
            confidence: n.confidence || "explicit",
          })),
          connections: edges.map(e => ({
            from: e.from, to: e.to, source_id: e.from, target_id: e.to,
            relationship: e.relationship, type: e.relationship,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Generation failed");
      }

      const result = await res.json();
      setContent(prev => ({ ...prev, [type]: result }));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [type]: err.message || "Failed to generate" }));
    }
    setLoading(prev => ({ ...prev, [type]: false }));
  }, [nodes, edges, content]);

  const handleTabClick = (type: DeliverableType) => {
    setActiveTab(type);
    // Narrative and TOC don't need generation — they use existing data
    if (type !== "narrative" && type !== "toc") {
      generate(type);
    }
  };

  const handleCopy = () => {
    const data = content[activeTab];
    if (!data) return;
    const text = typeof data.content === "string" ? data.content : JSON.stringify(data.content, null, 2);
    navigator.clipboard.writeText(text);
  };

  const toggleCheck = (key: string) => {
    setReviewChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderContent = () => {
    // Narrative tab = Situational Analysis download
    if (activeTab === "narrative") {
      return (
        <div style={{ textAlign: "center", padding: 40 }}>
          {analysisText ? (
            <>
              <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Download the situational analysis as a Word document.
              </p>
              <button
                onClick={() => downloadAsWord(analysisText, "situational-analysis.doc")}
                style={{
                  padding: "12px 28px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  background: "transparent", border: `1px solid ${t.borderAccent}`,
                  color: t.gold, borderRadius: 8, cursor: "pointer",
                }}
              >
                Download .doc
              </button>
            </>
          ) : (
            <p style={{ color: t.textMuted, fontSize: 13 }}>
              No situational analysis available. Upload documents to generate one.
            </p>
          )}
        </div>
      );
    }

    // TOC tab = Conditions Web as PNG
    if (activeTab === "toc") {
      return (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
            Download the conditions web as a PNG image.
          </p>
          <button
            onClick={() => downloadWebAsPng(dark)}
            style={{
              padding: "12px 28px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              background: "transparent", border: `1px solid ${t.borderAccent}`,
              color: t.gold, borderRadius: 8, cursor: "pointer",
            }}
          >
            Download .png
          </button>
        </div>
      );
    }

    if (loading[activeTab]) {
      return (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: `2px solid ${t.border}`, borderTopColor: t.gold,
            margin: "0 auto 16px", animation: "spin 1s linear infinite",
          }} />
          <p style={{ color: t.textMuted, fontSize: 13 }}>Generating...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    if (errors[activeTab]) {
      return <div style={{ padding: 24, color: "#c97a28", fontSize: 13 }}>{errors[activeTab]}</div>;
    }

    const data = content[activeTab];
    if (!data) {
      return (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 16 }}>
            Generate this deliverable from your {nodes.length} conditions.
          </p>
          <button onClick={() => generate(activeTab)} style={{
            padding: "10px 24px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            background: "transparent", border: `1px solid ${t.borderAccent}`,
            color: t.gold, borderRadius: 8, cursor: "pointer",
          }}>Generate</button>
        </div>
      );
    }

    // Checklist renders structured data with interactive checkboxes
    if (activeTab === "checklist" && typeof data.content === "object") {
      return <ChecklistView data={data.content} t={t} reviewChecks={reviewChecks} toggleCheck={toggleCheck} />;
    }

    // Logic model renders as a visual diagram when structured data is available
    if (activeTab === "logic-model" && typeof data.content === "object" && data.content?.columns) {
      return <LogicModelDiagram data={data.content} dark={dark} t={t} />;
    }

    // Other deliverables render markdown
    return (
      <div style={{ padding: "16px 20px" }}>
        <Markdown components={{
          h1: ({ children }) => <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: t.text, marginTop: 24, marginBottom: 10, borderBottom: `1px solid ${t.border}`, paddingBottom: 6 }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: t.text, marginTop: 20, marginBottom: 8 }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, color: t.gold, marginTop: 16, marginBottom: 6 }}>{children}</h3>,
          p: ({ children }) => <p style={{ fontSize: 13, lineHeight: 1.7, color: t.text, marginBottom: 10 }}>{children}</p>,
          ul: ({ children }) => <ul style={{ paddingLeft: 18, marginBottom: 10 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: 18, marginBottom: 10 }}>{children}</ol>,
          li: ({ children }) => <li style={{ fontSize: 13, lineHeight: 1.7, color: t.text, marginBottom: 3 }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
          blockquote: ({ children }) => <blockquote style={{ borderLeft: `3px solid ${t.gold}`, paddingLeft: 14, color: t.textMuted, fontStyle: "italic", margin: "10px 0" }}>{children}</blockquote>,
          hr: () => <hr style={{ border: "none", borderTop: `1px solid ${t.border}`, margin: "16px 0" }} />,
          table: ({ children }) => <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>{children}</table>,
          thead: ({ children }) => <thead style={{ background: `${t.gold}15` }}>{children}</thead>,
          th: ({ children }) => <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: `2px solid ${t.border}`, color: t.gold, fontSize: 11, fontWeight: 600 }}>{children}</th>,
          td: ({ children }) => <td style={{ padding: "6px 10px", borderBottom: `1px solid ${t.border}`, color: t.text, fontSize: 12, lineHeight: 1.5 }}>{children}</td>,
          tr: ({ children }) => <tr style={{ transition: "background 0.15s" }}>{children}</tr>,
        }}>
          {data.content}
        </Markdown>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: `1px solid ${t.border}`,
      }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: t.textDim }}>
          Deliverables
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {content[activeTab] && (
            <button onClick={handleCopy} style={{
              padding: "3px 10px", fontSize: 9, borderRadius: 4,
              background: "transparent", border: `1px solid ${t.border}`,
              color: t.textMuted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>Copy</button>
          )}
          <button onClick={onClose} style={{
            background: "none", border: "none", color: t.textDim, fontSize: 16, cursor: "pointer",
          }}>×</button>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, padding: "0 16px" }}>
        {TABS.map(tab => (
          <div key={tab.key} onClick={() => handleTabClick(tab.key)} style={{
            padding: "9px 12px", fontSize: 10, cursor: "pointer",
            color: activeTab === tab.key ? t.gold : t.textDim,
            borderBottom: activeTab === tab.key ? `2px solid ${t.gold}` : "2px solid transparent",
            transition: "all 0.2s", fontWeight: activeTab === tab.key ? 500 : 400,
          }}>
            {tab.label}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>{renderContent()}</div>
    </div>
  );
}

function ChecklistView({ data, t, reviewChecks, toggleCheck }: {
  data: any; t: ThemeTokens;
  reviewChecks: Record<string, boolean>;
  toggleCheck: (key: string) => void;
}) {
  const allChecks = [
    { key: "all_domains_covered", label: "All 8 domains covered", auto: data.checks?.all_domains_covered },
    { key: "no_orphan_conditions", label: "No orphan conditions (all connected)", auto: data.checks?.no_orphan_conditions },
    { key: "has_program_contributions", label: "Program contributions identified", auto: data.checks?.has_program_contributions },
    { key: "subpopulation_explored", label: "Subpopulation variation explored", auto: data.checks?.subpopulation_explored },
    { key: "language_fidelity", label: "Conditions use the organization's language", auto: null },
    { key: "ecological_adequate", label: "Ecological/spiritual conditions adequately surfaced (if relevant)", auto: null },
    { key: "gaps_honest", label: "Gaps honestly named", auto: null },
    { key: "felt_experience", label: "Felt experience captured where described", auto: null },
  ];

  return (
    <div style={{ padding: "16px 20px", fontSize: 13, lineHeight: 1.8, color: t.text }}>
      <div style={{ marginBottom: 16 }}>
        <strong>{data.total_conditions}</strong> conditions · <strong>{data.total_connections}</strong> connections
      </div>

      {/* Domain coverage */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 500, marginBottom: 8, color: t.gold, fontSize: 12 }}>Domain Coverage</div>
        {Object.entries(data.domain_coverage || {}).map(([domain, count]) => (
          <div key={domain} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 12 }}>
            <span>{domain}</span>
            <span style={{ color: t.textMuted }}>{count as number}</span>
          </div>
        ))}
        {data.missing_domains?.length > 0 && (
          <div style={{ marginTop: 6, color: "#c97a28", fontSize: 12 }}>
            Missing: {data.missing_domains.join(", ")}
          </div>
        )}
      </div>

      {/* Interactive checklist */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 500, marginBottom: 8, color: t.gold, fontSize: 12 }}>Review Checklist</div>
        {allChecks.map(check => {
          const checked = check.auto !== null ? check.auto : (reviewChecks[check.key] || false);
          const isManual = check.auto === null;
          return (
            <div
              key={check.key}
              onClick={() => isManual && toggleCheck(check.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "6px 0", cursor: isManual ? "pointer" : "default",
                fontSize: 12,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: `1.5px solid ${checked ? "#6B8F71" : t.border}`,
                background: checked ? "#6B8F7120" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                {checked && <span style={{ color: "#6B8F71", fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ color: checked ? t.text : t.textMuted }}>
                {check.label}
                {!isManual && <span style={{ fontSize: 9, color: t.textDim, marginLeft: 6 }}>auto</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* Orphans */}
      {data.orphan_conditions?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 6, color: "#c97a28", fontSize: 12 }}>
            Orphan Conditions ({data.orphan_conditions.length})
          </div>
          {data.orphan_conditions.map((c: any) => (
            <div key={c.id} style={{ fontSize: 12, color: t.textMuted, padding: "2px 0" }}>{c.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
