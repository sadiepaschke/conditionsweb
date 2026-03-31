import type { WebMetadata } from "../types/onboarding";

const BASE = "/api";

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Web CRUD
  createWeb: (metadata: WebMetadata) =>
    request("/webs", { method: "POST", body: JSON.stringify(metadata) }),

  getWeb: (webId: string) =>
    request(`/webs/${webId}`),

  listWebs: () =>
    request("/webs"),

  updateWeb: (webId: string, data: Partial<WebMetadata>) =>
    request(`/webs/${webId}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Condition/connection sync
  syncConditions: (webId: string, nodes: any[], turnNumber?: number) =>
    request(`/webs/${webId}/conditions`, {
      method: "POST",
      body: JSON.stringify({ nodes, turnNumber }),
    }),

  syncConnections: (webId: string, edges: any[]) =>
    request(`/webs/${webId}/connections`, {
      method: "POST",
      body: JSON.stringify({ edges }),
    }),

  // Conversation turns
  saveTurn: (webId: string, turn: { turn_number: number; role: string; content: string; raw_web_data?: any }) =>
    request(`/webs/${webId}/turns`, { method: "POST", body: JSON.stringify(turn) }),

  getTurns: (webId: string) =>
    request(`/webs/${webId}/turns`),

  // Chat (Gemini proxy)
  chat: (payload: any) =>
    request("/chat", { method: "POST", body: JSON.stringify(payload) }),

  // Graph queries
  getDensity: (webId: string) =>
    request(`/webs/${webId}/graph/density`),

  getPathways: (webId: string) =>
    request(`/webs/${webId}/graph/pathways`),

  // Deliverables
  generateDeliverable: (webId: string, type: "narrative" | "toc" | "logic-model" | "checklist") =>
    request(`/webs/${webId}/deliverables/${type}`, { method: "POST" }),

  // Document analysis
  analyze: async (files: File[], urls: string[]) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    formData.append("urls", JSON.stringify(urls));

    const res = await fetch("/api/analyze", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || `Analysis failed: ${res.status}`);
    }
    return res.json();
  },
};
