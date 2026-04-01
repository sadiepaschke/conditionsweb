import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Markdown from "react-markdown";
import { THEME, globalStyles } from "./constants/theme";
import { buildSystemPrompt } from "./constants/prompts";
import { parseWebData, cleanMessage } from "./utils/parseWebData";
import { exportAsJSON, exportAsCSV } from "./utils/exportWeb";
import { saveSession, loadSession, hasSession, clearSession } from "./utils/sessionStorage";
import { api } from "./services/api";
import ThemeToggle from "./components/layout/ThemeToggle";
import StartScreen from "./components/screens/StartScreen";
import LitReviewScreen from "./components/screens/LitReviewScreen";
import AnalysisReview from "./components/screens/AnalysisReview";
import WhatIsThisModal from "./components/screens/WhatIsThisModal";
import WebVisualization from "./components/web/WebVisualization";
import WebLegend from "./components/web/WebLegend";
import ConditionEditor from "./components/web/ConditionEditor";
import CrossWebIndicator from "./components/web/CrossWebIndicator";
import DomainTracker from "./components/chat/DomainTracker";
import DeliverablePanel from "./components/deliverables/DeliverablePanel";
import type { Message, WebData, Domain } from "./types";
import type { WebScope } from "./types/onboarding";

type AppScreen = "start" | "litreview" | "analysis" | "chat";
type RightPanel = "web" | "edit" | "deliverables";

const ALL_DOMAINS: Domain[] = [
  "historical", "situational", "population", "community",
  "structural", "organizational", "market", "ecological",
];

export default function App() {
  const [dark, setDark] = useState(true);
  const [screen, setScreen] = useState<AppScreen>("start");
  const [webId, setWebId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [webData, setWebData] = useState<WebData>({ nodes: [], edges: [] });
  const [webVisible, setWebVisible] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [useExpressApi, setUseExpressApi] = useState(false);
  const [filteredDomains, setFilteredDomains] = useState<Set<Domain>>(new Set(ALL_DOMAINS));
  const [selectedSubpop, setSelectedSubpop] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("web");

  // Two-layer state
  const [currentScope, setCurrentScope] = useState<WebScope>("organizational");
  const [orgWebId, setOrgWebId] = useState<string | null>(null);
  const [programWebId, setProgramWebId] = useState<string | null>(null);
  const [orgWebData, setOrgWebData] = useState<WebData>({ nodes: [], edges: [] });
  const [orgMessages, setOrgMessages] = useState<Message[]>([]);
  const orgConvHistory = useRef<any[]>([]);
  const orgTurnCount = useRef(0);
  // Program state saved when switching back to org
  const [savedProgramMessages, setSavedProgramMessages] = useState<Message[]>([]);
  const [savedProgramWebData, setSavedProgramWebData] = useState<WebData>({ nodes: [], edges: [] });
  const programConvHistory = useRef<any[]>([]);
  const programTurnCount = useRef(0);

  // Analysis state
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisSources, setAnalysisSources] = useState<{ files: string[]; urls: string[] }>({ files: [], urls: [] });
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const conversationHistory = useRef<{ role: string; parts: { text: string }[] }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const systemPromptRef = useRef<string>(buildSystemPrompt());
  const turnCountRef = useRef(0);

  const t = dark ? THEME.dark : THEME.light;
  const inChat = screen === "chat";

  // Extract unique subpopulations from web data
  const subpopulations = useMemo(() => {
    const subs = new Set<string>();
    for (const node of webData.nodes) {
      if (node.subpopulation) {
        for (const sp of node.subpopulation) subs.add(sp);
      }
    }
    return Array.from(subs);
  }, [webData.nodes]);

  const handleToggleDomain = useCallback((domain: Domain) => {
    setFilteredDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) {
        if (next.size > 1) next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  }, []);

  // Check Express API on mount
  useEffect(() => {
    fetch("/api/health")
      .then(async r => {
        if (!r.ok) { setUseExpressApi(false); return; }
        const data = await r.json();
        setUseExpressApi(data?.status === "ok");
      })
      .catch(() => setUseExpressApi(false));
  }, []);

  // Check for saved session on mount
  useEffect(() => {
    if (hasSession()) {
      const session = loadSession();
      if (session) {
        // Restore org layer
        setOrgMessages(session.org.messages);
        setOrgWebData(session.org.webData);
        orgConvHistory.current = session.org.conversationHistory;
        orgTurnCount.current = session.org.turnCount;

        // Restore program layer if exists
        if (session.program) {
          setSavedProgramMessages(session.program.messages);
          setSavedProgramWebData(session.program.webData);
          programConvHistory.current = session.program.conversationHistory;
          programTurnCount.current = session.program.turnCount;
        }

        // Restore current scope
        setCurrentScope(session.scope);
        if (session.scope === "organizational") {
          setMessages(session.org.messages);
          setWebData(session.org.webData);
          conversationHistory.current = [...session.org.conversationHistory];
          turnCountRef.current = session.org.turnCount;
        } else if (session.program) {
          setMessages(session.program.messages);
          setWebData(session.program.webData);
          conversationHistory.current = [...session.program.conversationHistory];
          turnCountRef.current = session.program.turnCount;
        }

        setAnalysisText(session.analysisText);
        setScreen("chat");
      }
    }
  }, []);

  // Auto-save session after each message
  useEffect(() => {
    if (screen !== "chat" || messages.length === 0) return;

    const orgM = currentScope === "organizational" ? messages : orgMessages;
    const orgW = currentScope === "organizational" ? webData : orgWebData;
    const orgC = currentScope === "organizational" ? conversationHistory.current : orgConvHistory.current;
    const orgT = currentScope === "organizational" ? turnCountRef.current : orgTurnCount.current;
    const progM = currentScope === "program" ? messages : savedProgramMessages;
    const progW = currentScope === "program" ? webData : savedProgramWebData;
    const progC = currentScope === "program" ? conversationHistory.current : programConvHistory.current;
    const progT = currentScope === "program" ? turnCountRef.current : programTurnCount.current;

    saveSession({
      scope: currentScope,
      orgMessages: orgM, orgWebData: orgW, orgConversationHistory: orgC, orgTurnCount: orgT,
      programMessages: progM, programWebData: progW, programConversationHistory: progC, programTurnCount: progT,
      analysisText,
    });
  }, [messages, webData, currentScope]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (userText: string, showInChat = true) => {
    if (!userText.trim() || loading) return;

    turnCountRef.current++;
    const turnNumber = turnCountRef.current;

    conversationHistory.current.push({
      role: "user",
      parts: [{ text: userText }],
    });

    if (showInChat) {
      setMessages(prev => [...prev, { role: "user", text: userText }]);
    }
    setInput("");
    setLoading(true);

    if (useExpressApi && webId) {
      api.saveTurn(webId, { turn_number: turnNumber, role: "user", content: userText }).catch(() => {});
    }

    try {
      const chatPayload = {
        system_instruction: { parts: [{ text: systemPromptRef.current }] },
        contents: conversationHistory.current,
        generationConfig: { maxOutputTokens: 8000 },
      };

      let data: any;
      if (useExpressApi) {
        data = await api.chat(chatPayload);
      } else {
        const response = await fetch("/.netlify/functions/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chatPayload),
        });
        data = await response.json();
      }

      if (data.error) {
        conversationHistory.current.pop();
        setMessages(prev => [...prev, { role: "assistant", text: `API error: ${data.error.message || "Unknown error"}` }]);
        setLoading(false);
        return;
      }

      const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!fullText) {
        conversationHistory.current.pop();
        setMessages(prev => [...prev, { role: "assistant", text: "No response received. Please try again." }]);
        setLoading(false);
        return;
      }

      let parsed: any = null;
      let clean = fullText;
      try {
        parsed = parseWebData(fullText);
        clean = cleanMessage(fullText);
      } catch (parseErr) {
        console.error("Failed to parse web data:", parseErr);
        clean = fullText.replace(/\n?\{[\s\S]*$/, "").trim() || fullText;
      }
      if (parsed) {
        console.log("Parsed web data:", parsed.nodes.length, "nodes,", parsed.edges.length, "edges");
        setWebData(parsed);
        if (useExpressApi && webId) {
          api.syncConditions(webId, parsed.nodes, turnNumber).catch(() => {});
          api.syncConnections(webId, parsed.edges).catch(() => {});
        }
      }
      conversationHistory.current.push({ role: "model", parts: [{ text: fullText }] });
      setMessages(prev => [...prev, { role: "assistant", text: clean }]);

      if (useExpressApi && webId) {
        turnCountRef.current++;
        api.saveTurn(webId, { turn_number: turnCountRef.current, role: "model", content: fullText, raw_web_data: parsed }).catch(() => {});
      }
    } catch (err) {
      conversationHistory.current.pop();
      setMessages(prev => [...prev, { role: "assistant", text: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  }, [loading, webId, useExpressApi]);

  // --- Handlers ---

  const handleStartClick = () => {
    if (hasSession()) {
      // Offer to resume
      const session = loadSession();
      if (session && session.org.messages.length > 0) {
        // Auto-resume from saved session (already loaded in useEffect)
        return;
      }
    }
    setScreen("litreview");
  };

  const handleAnalyze = async (files: File[], urls: string[]) => {
    setUploadedFiles(files);
    setUploadedUrls(urls);
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await api.analyze(files, urls);
      setAnalysisText(result.analysis || "");
      setAnalysisSources(result.sources || { files: [], urls: [] });
      setScreen("analysis");
    } catch (e: any) {
      setAnalyzeError(e.message || "Analysis failed. Try again or skip.");
    }
    setAnalyzing(false);
  };

  const handleRegenerate = async () => {
    setAnalyzing(true);
    try {
      const result = await api.analyze(uploadedFiles, uploadedUrls);
      setAnalysisText(result.analysis);
      setAnalysisSources(result.sources);
    } catch (e: any) {
      console.error("Regeneration failed:", e);
    }
    setAnalyzing(false);
  };

  const handleAnalysisConfirm = (editedAnalysis: string) => {
    setAnalysisText(editedAnalysis);
    systemPromptRef.current = buildSystemPrompt({ analysis: editedAnalysis });
    setScreen("chat");
    sendMessage("Hello, I'd like to map my organization's conditions web.", false);
  };

  const handleSkipLitReview = () => {
    setScreen("chat");
    sendMessage("Hello, I'd like to map my organization's conditions web.", false);
  };

  const handleScopeSwitch = (newScope: WebScope) => {
    if (newScope === currentScope) return;

    if (newScope === "program") {
      // Save org state
      setOrgMessages([...messages]);
      setOrgWebData({ ...webData });
      orgConvHistory.current = [...conversationHistory.current];
      orgTurnCount.current = turnCountRef.current;

      // Restore or start program
      setCurrentScope("program");
      if (savedProgramMessages.length > 0) {
        setMessages(savedProgramMessages);
        setWebData(savedProgramWebData);
        conversationHistory.current = [...programConvHistory.current];
        turnCountRef.current = programTurnCount.current;
      } else {
        setMessages([]);
        setWebData({ nodes: [], edges: [] });
        conversationHistory.current = [];
        turnCountRef.current = 0;

        // Build prompt with org web context
        const orgSummary = webData.nodes.length > 0
          ? `\n\nORGANIZATIONAL WEB (already mapped — ${webData.nodes.length} conditions):\n` +
            webData.nodes.map(n => `- ${n.label} (${n.domain})`).join("\n") +
            "\n\nThe program web builds on top of this. Reference these org conditions when relevant."
          : "";
        systemPromptRef.current = buildSystemPrompt({ analysis: (analysisText || "") + orgSummary });
        sendMessage("I'd like to start mapping the program web now.", false);
      }
    } else {
      // Save program state
      setSavedProgramMessages([...messages]);
      setSavedProgramWebData({ ...webData });
      programConvHistory.current = [...conversationHistory.current];
      programTurnCount.current = turnCountRef.current;

      // Restore org
      setCurrentScope("organizational");
      setMessages(orgMessages);
      setWebData(orgWebData);
      conversationHistory.current = [...orgConvHistory.current];
      turnCountRef.current = orgTurnCount.current;
    }
  };

  const handleNewSession = () => {
    clearSession();
    setMessages([]);
    setWebData({ nodes: [], edges: [] });
    setOrgMessages([]);
    setOrgWebData({ nodes: [], edges: [] });
    setSavedProgramMessages([]);
    setSavedProgramWebData({ nodes: [], edges: [] });
    conversationHistory.current = [];
    orgConvHistory.current = [];
    programConvHistory.current = [];
    turnCountRef.current = 0;
    orgTurnCount.current = 0;
    programTurnCount.current = 0;
    setCurrentScope("organizational");
    setAnalysisText(null);
    setScreen("start");
  };

  const handleUpdateNodes = (nodes: any[]) => setWebData(prev => ({ ...prev, nodes }));
  const handleUpdateEdges = (edges: any[]) => setWebData(prev => ({ ...prev, edges }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) sendMessage(input);
    }
  };

  return (
    <>
      <style>{globalStyles(dark)}</style>
      {modalOpen && <WhatIsThisModal onClose={() => setModalOpen(false)} dark={dark} />}

      <div style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: t.bg, color: t.text, transition: "all 0.3s",
        maxWidth: 1400, margin: "0 auto",
      }}>
        {/* Header */}
        <header style={{
          padding: "20px 32px",
          borderBottom: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              onClick={inChat ? handleNewSession : undefined}
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22, color: dark ? "#cbb26a" : "#7a5f15",
                letterSpacing: -0.3,
                cursor: inChat ? "pointer" : "default",
              }}
            >
              Conditions Web
            </span>
            <span style={{
              fontSize: 12, color: t.textDim,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Anthralytic
            </span>
            {inChat && (
              <span
                onClick={() => {
                  if (window.confirm("Start a new session? Current progress is saved and can be resumed.")) {
                    handleNewSession();
                  }
                }}
                style={{
                  fontSize: 10, color: t.textDim, cursor: "pointer",
                  marginLeft: 8, padding: "3px 10px",
                  border: `1px solid ${t.border}`, borderRadius: 10,
                  transition: "color 0.2s",
                }}
              >
                New session
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {inChat && (
              <>
                {/* Layer switcher */}
                <div style={{
                  display: "flex", borderRadius: 20, overflow: "hidden",
                  border: `1px solid ${t.border}`,
                }}>
                  {(["organizational", "program"] as WebScope[]).map(scope => (
                    <button
                      key={scope}
                      onClick={() => handleScopeSwitch(scope)}
                      style={{
                        padding: "6px 14px", fontSize: 11, fontWeight: 500,
                        fontFamily: "'DM Sans', sans-serif",
                        background: currentScope === scope ? `${t.gold}18` : "transparent",
                        border: "none",
                        color: currentScope === scope ? t.gold : t.textDim,
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {scope === "organizational" ? "Org" : "Program"}
                    </button>
                  ))}
                </div>

                {/* Right panel controls */}
                {webData.nodes.length > 0 && (
                  <>
                    <button
                      onClick={() => setRightPanel(rightPanel === "edit" ? "web" : "edit")}
                      style={{
                        background: rightPanel === "edit" ? `${t.gold}18` : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                        border: `1px solid ${rightPanel === "edit" ? t.borderAccent : t.border}`,
                        color: rightPanel === "edit" ? t.gold : t.textMuted,
                        padding: "6px 12px", borderRadius: 20, fontSize: 11,
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.2s",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setRightPanel(rightPanel === "deliverables" ? "web" : "deliverables")}
                      style={{
                        background: rightPanel === "deliverables" ? `${t.gold}18` : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                        border: `1px solid ${rightPanel === "deliverables" ? t.borderAccent : t.border}`,
                        color: rightPanel === "deliverables" ? t.gold : t.textMuted,
                        padding: "6px 12px", borderRadius: 20, fontSize: 11,
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.2s",
                      }}
                    >
                      Deliverables
                    </button>
                    {/* Export dropdown */}
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => {
                          const menu = document.getElementById("export-menu");
                          if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
                        }}
                        style={{
                          background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                          border: `1px solid ${t.border}`,
                          color: t.textMuted, padding: "6px 12px",
                          borderRadius: 20, fontSize: 11, cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Export
                      </button>
                      <div id="export-menu" style={{
                        display: "none", position: "absolute", right: 0, top: 34,
                        background: t.surface, border: `1px solid ${t.border}`,
                        borderRadius: 8, overflow: "hidden", zIndex: 100,
                        minWidth: 120,
                      }}>
                        <button onClick={() => { exportAsJSON(webData); }} style={{
                          display: "block", width: "100%", padding: "8px 16px",
                          fontSize: 12, textAlign: "left", background: "none",
                          border: "none", color: t.text, cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                        }}>JSON</button>
                        <button onClick={() => { exportAsCSV(webData); }} style={{
                          display: "block", width: "100%", padding: "8px 16px",
                          fontSize: 12, textAlign: "left", background: "none",
                          border: "none", borderTop: `1px solid ${t.border}`,
                          color: t.text, cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                        }}>CSV</button>
                      </div>
                    </div>
                  </>
                )}
                <button
                  onClick={() => setWebVisible(!webVisible)}
                  style={{
                    background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${t.border}`,
                    color: t.textMuted, padding: "6px 12px",
                    borderRadius: 20, fontSize: 11, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  {webVisible ? "Hide" : "Show"}
                </button>
              </>
            )}
            {inChat && analysisText && (
              <button
                onClick={() => {
                  const blob = new Blob([analysisText], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "situational-analysis.md";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                style={{
                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${t.border}`,
                  color: t.textMuted, padding: "6px 12px",
                  borderRadius: 20, fontSize: 11, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                Analysis
              </button>
            )}
            <ThemeToggle dark={dark} setDark={setDark} />
          </div>
        </header>

        {/* Main content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left panel */}
          <div style={{
            display: "flex", flexDirection: "column", flex: 1, minWidth: 0, maxWidth: inChat && webVisible ? "50%" : "none",
            borderRight: inChat && webVisible ? `1px solid ${t.border}` : "none",
          }}>
            {screen === "start" && (
              <StartScreen
                onStart={handleStartClick}
                onOpenModal={() => setModalOpen(true)}
                dark={dark}
              />
            )}

            {screen === "litreview" && (
              <LitReviewScreen
                dark={dark}
                onAnalyze={handleAnalyze}
                onSkip={handleSkipLitReview}
                loading={analyzing}
                error={analyzeError}
              />
            )}

            {screen === "analysis" && (
              <AnalysisReview
                dark={dark}
                analysis={analysisText}
                sources={analysisSources}
                onConfirm={handleAnalysisConfirm}
                onRegenerate={handleRegenerate}
                regenerating={analyzing}
              />
            )}

            {screen === "chat" && (
              <>
                <DomainTracker t={t} scope={currentScope} conditions={webData.nodes} />

                {/* Messages */}
                <div style={{
                  flex: 1, overflowY: "auto", padding: 32,
                  display: "flex", flexDirection: "column", gap: 24,
                }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 14, maxWidth: 720,
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      flexDirection: msg.role === "user" ? "row-reverse" : "row",
                      animation: "fadeUp 0.3s ease-out",
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        flexShrink: 0, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600, marginTop: 2,
                        background: msg.role === "assistant"
                          ? `${dark ? "#cbb26a" : "#7a5f15"}18`
                          : `${dark ? "#c99d28" : "#7a5f15"}18`,
                        border: `1px solid ${msg.role === "assistant"
                          ? (dark ? "rgba(203,178,106,0.3)" : "rgba(120,95,30,0.3)")
                          : (dark ? "rgba(201,157,40,0.3)" : "rgba(120,95,30,0.3)")}`,
                        color: msg.role === "assistant"
                          ? (dark ? "#cbb26a" : "#7a5f15")
                          : (dark ? "#c99d28" : "#7a5f15"),
                      }}>
                        {msg.role === "assistant" ? "CW" : "You"}
                      </div>
                      <div style={{
                        fontSize: 14, lineHeight: 1.7,
                        color: msg.role === "user" ? t.textMuted : t.text,
                        maxWidth: 580,
                        textAlign: msg.role === "user" ? "right" : "left",
                      }}>
                        {msg.role === "assistant" ? (
                          <Markdown components={{
                            p: ({ children }) => <p style={{ marginBottom: 10, lineHeight: 1.7 }}>{children}</p>,
                            ul: ({ children }) => <ul style={{ paddingLeft: 18, marginBottom: 10 }}>{children}</ul>,
                            ol: ({ children }) => <ol style={{ paddingLeft: 18, marginBottom: 10 }}>{children}</ol>,
                            li: ({ children }) => <li style={{ marginBottom: 3, lineHeight: 1.7 }}>{children}</li>,
                            strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                            em: ({ children }) => <em style={{ fontStyle: "italic", color: t.textMuted }}>{children}</em>,
                            h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, color: t.gold, marginTop: 14, marginBottom: 6 }}>{children}</h3>,
                          }}>{msg.text}</Markdown>
                        ) : (
                          <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div style={{ display: "flex", gap: 14, maxWidth: 720 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        flexShrink: 0, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600,
                        background: `${dark ? "#cbb26a" : "#7a5f15"}18`,
                        border: `1px solid ${dark ? "rgba(203,178,106,0.3)" : "rgba(120,95,30,0.3)"}`,
                        color: dark ? "#cbb26a" : "#7a5f15",
                      }}>
                        CW
                      </div>
                      <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
                        <div className="typing-dot" />
                        <div className="typing-dot" style={{ animationDelay: "0.15s" }} />
                        <div className="typing-dot" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div style={{
                  padding: "20px 32px 24px",
                  borderTop: `1px solid ${t.border}`,
                  flexShrink: 0,
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={currentScope === "organizational" ? "Tell me about your organization..." : "Tell me about your program..."}
                      rows={1}
                      disabled={loading}
                      style={{
                        flex: 1,
                        background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        border: `1px solid ${t.border}`,
                        borderRadius: 12, padding: "12px 16px",
                        color: t.text, fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14, resize: "none", outline: "none",
                        minHeight: 44, maxHeight: 120, lineHeight: 1.5,
                        transition: "border-color 0.2s",
                      }}
                      onFocus={e => { e.target.style.borderColor = t.borderAccent; }}
                      onBlur={e => { e.target.style.borderColor = t.border; }}
                    />
                    <button
                      onClick={() => { if (input.trim() && !loading) sendMessage(input); }}
                      disabled={loading || !input.trim()}
                      style={{
                        background: `${t.gold}18`,
                        border: `1px solid ${t.borderAccent}`,
                        color: t.gold, width: 44, height: 44,
                        borderRadius: 10, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s", flexShrink: 0, fontSize: 16,
                        opacity: loading || !input.trim() ? 0.25 : 1,
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right panel */}
          {inChat && webVisible && (
            <div style={{
              flex: 1.2, minWidth: 500, flexShrink: 0,
              display: "flex", flexDirection: "column",
              background: dark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)",
            }}>
              {rightPanel === "deliverables" ? (
                <DeliverablePanel
                  nodes={webData.nodes}
                  edges={webData.edges}
                  webId={webId}
                  t={t}
                  dark={dark}
                  onClose={() => setRightPanel("web")}
                />
              ) : rightPanel === "edit" ? (
                <ConditionEditor
                  dark={dark}
                  nodes={webData.nodes}
                  edges={webData.edges}
                  onUpdateNodes={handleUpdateNodes}
                  onUpdateEdges={handleUpdateEdges}
                  onClose={() => setRightPanel("web")}
                />
              ) : (
                <>
                  <WebLegend
                    t={t}
                    filteredDomains={filteredDomains}
                    onToggleDomain={handleToggleDomain}
                    subpopulations={subpopulations}
                    selectedSubpop={selectedSubpop}
                    onSelectSubpop={setSelectedSubpop}
                  />

                  <div style={{
                    flex: 1, overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 16,
                  }}>
                    <WebVisualization
                      nodes={webData.nodes}
                      edges={webData.edges}
                      dark={dark}
                      filteredDomains={filteredDomains}
                      selectedSubpop={selectedSubpop}
                    />
                  </div>

                  {webData.nodes.length > 0 && (
                    <>
                      <div style={{
                        fontSize: 11, color: t.textDim,
                        padding: "8px 24px 4px", textAlign: "center",
                      }}>
                        {webData.nodes.length} conditions · {webData.edges.length} relationships
                      </div>
                      {currentScope === "program" && orgWebData.nodes.length > 0 && (
                        <CrossWebIndicator
                          t={t}
                          orgConditions={orgWebData.nodes}
                          programConditions={webData.nodes}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
