import type { Message, WebData } from "../types";
import type { WebScope } from "../types/onboarding";

const STORAGE_KEY = "conditions-web-session";

interface SessionData {
  scope: WebScope;
  org: LayerState;
  program: LayerState | null;
  analysisText: string | null;
  savedAt: string;
}

interface LayerState {
  messages: Message[];
  webData: WebData;
  conversationHistory: { role: string; parts: { text: string }[] }[];
  turnCount: number;
}

export function saveSession(data: {
  scope: WebScope;
  orgMessages: Message[];
  orgWebData: WebData;
  orgConversationHistory: any[];
  orgTurnCount: number;
  programMessages: Message[];
  programWebData: WebData;
  programConversationHistory: any[];
  programTurnCount: number;
  analysisText: string | null;
}) {
  const session: SessionData = {
    scope: data.scope,
    org: {
      messages: data.orgMessages,
      webData: data.orgWebData,
      conversationHistory: data.orgConversationHistory,
      turnCount: data.orgTurnCount,
    },
    program: data.programMessages.length > 0 ? {
      messages: data.programMessages,
      webData: data.programWebData,
      conversationHistory: data.programConversationHistory,
      turnCount: data.programTurnCount,
    } : null,
    analysisText: data.analysisText,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch (e) {
    console.warn("Failed to save session:", e);
    return false;
  }
}

export function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSession(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
