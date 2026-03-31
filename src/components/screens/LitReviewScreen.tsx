import { useState, useRef, useCallback } from "react";
import { THEME } from "../../constants/theme";

interface LitReviewScreenProps {
  dark: boolean;
  onAnalyze: (files: File[], urls: string[]) => void;
  onSkip: () => void;
  loading: boolean;
  error?: string | null;
}

const LOADING_MESSAGES = [
  "Reading your documents...",
  "Extracting key information...",
  "Identifying conditions across domains...",
  "Building situational analysis...",
];

export default function LitReviewScreen({ dark, onAnalyze, onSkip, loading, error }: LitReviewScreenProps) {
  const t = dark ? THEME.dark : THEME.light;
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ".pdf,.docx,.txt,.md,.csv";

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setFiles(prev => [...prev, ...Array.from(newFiles)]);
  }, []);

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    try { new URL(url); } catch { return; }
    setUrls(prev => [...prev, url]);
    setUrlInput("");
  };

  const removeUrl = (index: number) => setUrls(prev => prev.filter((_, i) => i !== index));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const canAnalyze = (files.length > 0 || urls.length > 0) && !loading;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Show loading overlay when analyzing
  if (loading) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 48,
      }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          {/* Spinning dotted circle */}
          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 28px" }}>
            <svg viewBox="0 0 80 80" style={{ width: 80, height: 80, animation: "spin 3s linear infinite" }}>
              <circle
                cx="40" cy="40" r="36"
                fill="none"
                stroke={t.gold}
                strokeWidth="2"
                strokeDasharray="4 6"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>
            <svg viewBox="0 0 80 80" style={{
              position: "absolute", inset: 0,
              width: 80, height: 80,
              animation: "spin 5s linear infinite reverse",
            }}>
              <circle
                cx="40" cy="40" r="26"
                fill="none"
                stroke={t.gold}
                strokeWidth="1.5"
                strokeDasharray="3 8"
                strokeLinecap="round"
                opacity="0.4"
              />
            </svg>
          </div>

          <h3 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 20, color: t.text, marginBottom: 12,
          }}>
            Analyzing your documents
          </h3>

          {/* Cycling status messages */}
          <div style={{
            fontSize: 13, color: t.textMuted, lineHeight: 1.6,
            animation: "fadeUp 0.5s ease-out",
          }}>
            <div style={{ animation: "cycleFade 8s ease-in-out infinite" }}>
              {files.length > 0 && <span>{files.length} file{files.length !== 1 ? "s" : ""}</span>}
              {files.length > 0 && urls.length > 0 && <span> and </span>}
              {urls.length > 0 && <span>{urls.length} URL{urls.length !== 1 ? "s" : ""}</span>}
            </div>
          </div>

          <p style={{
            fontSize: 12, color: t.textDim, marginTop: 20,
          }}>
            This can take up to a minute depending on document size.
          </p>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes cycleFade {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
      </div>
    );
  }

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
        maxWidth: 540, width: "100%", position: "relative", zIndex: 1,
      }}>
        <h2 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 26, color: t.text, marginBottom: 8,
          textAlign: "center",
        }}>
          Start with what you have
        </h2>
        <p style={{
          fontSize: 14, color: t.textMuted, marginBottom: 32,
          textAlign: "center", lineHeight: 1.6,
        }}>
          Upload documents or paste website links — program proposals, needs
          assessments, annual reports, anything relevant. The AI will read
          everything and build a situational analysis to ground our conversation.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? t.borderAccent : t.border}`,
            borderRadius: 12, padding: "28px 24px",
            textAlign: "center", cursor: "pointer",
            background: dragOver ? `${t.gold}08` : "transparent",
            transition: "all 0.2s", marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>+</div>
          <div style={{ fontSize: 13, color: t.textMuted }}>
            Drop files here or click to browse
          </div>
          <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>
            PDF, DOCX, TXT, MD, CSV
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
            style={{ display: "none" }}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {files.map((file, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: 8,
                background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                marginBottom: 4, border: `1px solid ${t.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, color: t.text }}>{file.name}</div>
                  <div style={{ fontSize: 10, color: t.textDim }}>{formatSize(file.size)}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  style={{
                    background: "none", border: "none", color: t.textDim,
                    fontSize: 16, cursor: "pointer", padding: "0 4px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* URL input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
            placeholder="Paste a website URL..."
            style={{
              flex: 1, padding: "10px 14px", fontSize: 13,
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 8, color: t.text,
              fontFamily: "'DM Sans', sans-serif", outline: "none",
            }}
          />
          <button
            onClick={addUrl}
            disabled={!urlInput.trim()}
            style={{
              padding: "10px 16px", fontSize: 12, fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              background: "transparent", border: `1px solid ${t.border}`,
              color: t.textMuted, borderRadius: 8,
              cursor: urlInput.trim() ? "pointer" : "not-allowed",
              opacity: urlInput.trim() ? 1 : 0.4,
            }}
          >
            Add
          </button>
        </div>

        {/* URL list */}
        {urls.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {urls.map((url, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: 8,
                background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                marginBottom: 4, border: `1px solid ${t.border}`,
              }}>
                <div style={{ fontSize: 12, color: t.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>
                  {url}
                </div>
                <button
                  onClick={() => removeUrl(i)}
                  style={{
                    background: "none", border: "none", color: t.textDim,
                    fontSize: 16, cursor: "pointer", padding: "0 4px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginTop: 12,
            background: "rgba(180,80,40,0.1)",
            border: "1px solid rgba(180,80,40,0.25)",
            fontSize: 13, color: "#c97a28", lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 24,
        }}>
          <span
            onClick={onSkip}
            style={{
              fontSize: 13, color: t.textDim, cursor: "pointer",
              transition: "color 0.2s",
            }}
          >
            Skip — I'll just talk
          </span>
          <button
            onClick={() => onAnalyze(files, urls)}
            disabled={!canAnalyze}
            style={{
              padding: "12px 28px", fontSize: 14, fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              background: "transparent",
              border: `1px solid ${t.borderAccent}`,
              color: t.gold, borderRadius: 10,
              cursor: canAnalyze ? "pointer" : "not-allowed",
              opacity: canAnalyze ? 1 : 0.4,
              transition: "all 0.25s",
            }}
          >
            Analyze
          </button>
        </div>
      </div>
    </div>
  );
}
