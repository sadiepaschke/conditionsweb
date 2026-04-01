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

    // In dev, Vite proxies /api to Express (returns JSON).
    // In production, Netlify function streams SSE events.
    const isDev = window.location.hostname === "localhost";

    if (isDev) {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Analysis failed: ${res.status}`);
      }
      return res.json();
    }

    // Production: read SSE stream from Netlify function
    const res = await fetch("/.netlify/functions/analyze", { method: "POST", body: formData });
    if (!res.ok) {
      let errorMsg = `Analysis failed: ${res.status}`;
      try {
        const text = await res.text();
        const err = JSON.parse(text);
        if (err.error) errorMsg = err.error;
      } catch { /* use default */ }
      throw new Error(errorMsg);
    }

    // Handle both SSE stream and plain JSON responses
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("text/event-stream") && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let analysisText = "";
      let meta: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "meta") {
                meta = data;
              } else {
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                analysisText += text;
              }
            } catch { /* skip */ }
          }
        }
      }

      if (!analysisText) throw new Error("Analysis returned empty. Try a smaller document.");

      return {
        analysis: analysisText,
        sources: meta ? { files: meta.files, urls: meta.urls } : { files: [], urls: [] },
      };
    }

    // Fallback: plain JSON response
    const text = await res.text();
    return JSON.parse(text.trim());
  },
};
