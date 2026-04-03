import { useState } from "react";
import Markdown from "react-markdown";
import { THEME } from "../../constants/theme";
import { downloadAsWord } from "../../utils/downloadWord";

interface AnalysisReviewProps {
  dark: boolean;
  analysis: string | null;
  sources: { files: string[]; urls: string[] };
  onConfirm: (editedAnalysis: string) => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

function downloadAnalysis(text: string) {
  downloadAsWord(text, "situational-analysis.doc");
}

export default function AnalysisReview({
  dark, analysis, sources, onConfirm, onRegenerate, regenerating,
}: AnalysisReviewProps) {
  const t = dark ? THEME.dark : THEME.light;
  const [editedAnalysis, setEditedAnalysis] = useState(
    analysis || "The analysis could not extract enough content from the uploaded documents."
  );
  const [editing, setEditing] = useState(false);

  const sourceCount = (sources.files?.length || 0) + (sources.urls?.length || 0);

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      padding: "32px 48px", overflow: "hidden",
    }}>
      <div style={{
        maxWidth: 720, width: "100%", margin: "0 auto",
        display: "flex", flexDirection: "column", flex: 1,
        overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 24, color: t.text,
          }}>
            Situational Analysis
          </h2>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => downloadAnalysis(editedAnalysis)}
              style={{
                padding: "5px 14px", fontSize: 11, borderRadius: 6,
                background: "transparent",
                border: `1px solid ${t.border}`,
                color: t.textMuted,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >
              Download
            </button>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                padding: "5px 14px", fontSize: 11, borderRadius: 6,
                background: editing ? `${t.gold}15` : "transparent",
                border: `1px solid ${editing ? t.borderAccent : t.border}`,
                color: editing ? t.gold : t.textMuted,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {editing ? "Preview" : "Edit"}
            </button>
          </div>
        </div>
        <p style={{
          fontSize: 13, color: t.textMuted, marginBottom: 20,
          lineHeight: 1.6,
        }}>
          {editing
            ? "Edit the text below."
            : `Here is the situational analysis based on ${sourceCount} source${sourceCount !== 1 ? "s" : ""}. Please read through the analysis carefully and make sure it is correct. The conditions web will be based partly on this analysis so it is important that it is correct.`
          }
        </p>

        {/* Content area */}
        <div style={{
          flex: 1, overflow: "auto", borderRadius: 12,
          border: `1px solid ${t.border}`,
          background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
        }}>
          {editing ? (
            <textarea
              value={editedAnalysis}
              onChange={e => setEditedAnalysis(e.target.value)}
              style={{
                width: "100%", height: "100%",
                background: "transparent", border: "none",
                padding: "24px 28px",
                color: t.text, fontFamily: "'DM Sans', sans-serif",
                fontSize: 14, lineHeight: 1.8, resize: "none",
                outline: "none",
              }}
            />
          ) : (
            <div style={{ padding: "24px 28px" }}>
              <Markdown
                components={{
                  h1: ({ children }) => (
                    <h1 style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 22, color: t.text, marginTop: 28, marginBottom: 12,
                      borderBottom: `1px solid ${t.border}`, paddingBottom: 8,
                    }}>{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 18, color: t.text, marginTop: 24, marginBottom: 10,
                    }}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 15, fontWeight: 600, color: t.gold,
                      marginTop: 20, marginBottom: 8,
                    }}>{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p style={{
                      fontSize: 14, lineHeight: 1.8, color: t.text,
                      marginBottom: 12,
                    }}>{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li style={{
                      fontSize: 14, lineHeight: 1.8, color: t.text,
                      marginBottom: 4,
                    }}>{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: t.text, fontWeight: 600 }}>{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em style={{ color: t.textMuted, fontStyle: "italic" }}>{children}</em>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote style={{
                      borderLeft: `3px solid ${t.gold}`,
                      paddingLeft: 16, marginLeft: 0, marginBottom: 12,
                      color: t.textMuted, fontStyle: "italic",
                    }}>{children}</blockquote>
                  ),
                  hr: () => (
                    <hr style={{
                      border: "none", borderTop: `1px solid ${t.border}`,
                      margin: "20px 0",
                    }} />
                  ),
                }}
              >
                {editedAnalysis}
              </Markdown>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 20, paddingBottom: 8,
        }}>
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            style={{
              padding: "10px 20px", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              background: "transparent", border: "none",
              color: t.textMuted, cursor: regenerating ? "not-allowed" : "pointer",
              opacity: regenerating ? 0.4 : 1,
            }}
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>
          <button
            onClick={() => onConfirm(editedAnalysis)}
            style={{
              padding: "12px 28px", fontSize: 14, fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              background: "transparent",
              border: `1px solid ${t.borderAccent}`,
              color: t.gold, borderRadius: 10, cursor: "pointer",
              transition: "all 0.25s",
            }}
          >
            Looks good, let's begin
          </button>
        </div>
      </div>
    </div>
  );
}
