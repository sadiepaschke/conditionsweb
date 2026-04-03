import type { WebData, Domain } from "../types";

const TYPE_TO_DOMAIN: Record<string, Domain> = {
  historical: "historical",
  situational: "situational",
  participant: "population",
  population: "population",
  community: "community",
  landscape: "structural",
  structural: "structural",
  organizational: "organizational",
  market: "market",
  ecological: "ecological",
  program: "organizational",
  relational: "community",
  risks: "situational",
};

// Normalize IDs: pad single-digit c-N to c-0N for consistency
function normalizeId(id: string): string {
  return String(id).replace(/^c-(\d)$/, "c-0$1");
}

// Match JSON block at the end of text — with or without --- separator
const JSON_PATTERNS = [
  /---\s*(\{[\s\S]*\})\s*$/,              // standard: --- followed by JSON
  /\n(\{"conditions"[\s\S]*\})\s*$/,       // conditions JSON without ---
  /\n(\{"nodes"[\s\S]*\})\s*$/,            // nodes JSON without ---
  /\n(\{"organization_name"[\s\S]*\})\s*$/, // onboarding+conditions JSON without ---
];

export interface ParseResult {
  webData: WebData;
  droppedEdges: number;
}

export function parseWebData(text: string): ParseResult | null {
  for (const pattern of JSON_PATTERNS) {
    try {
      const match = text.match(pattern);
      if (!match) continue;

      const raw = JSON.parse(match[1]);
      if (!raw.conditions && !raw.nodes) continue;

      const rawNodes = raw.conditions || raw.nodes || [];
      const rawEdges = raw.connections || raw.edges || [];

      const nodes = rawNodes
        .filter((n: any) => n && n.id)
        .map((n: any) => {
          const domain = n.domain || TYPE_TO_DOMAIN[n.type] || "situational";
          return {
            id: normalizeId(n.id),
            label: String(n.name || n.label || "Unnamed"),
            domain,
            is_program_contribution: n.is_program_contribution || n.type === "program" || false,
            subpopulation: Array.isArray(n.subpopulation) ? n.subpopulation : [],
            confidence: n.confidence || "inferred",
            felt_experience: n.felt_experience || null,
            source: "ai" as const,
          };
        });

      const nodeIds = new Set(nodes.map((n: any) => n.id));

      // Map and normalize edge IDs
      const allEdges = rawEdges
        .filter((e: any) => e && (e.source_id || e.from) && (e.target_id || e.to))
        .map((e: any) => ({
          from: normalizeId(e.source_id || e.from),
          to: normalizeId(e.target_id || e.to),
          relationship: String(e.type || e.relationship || "produces"),
        }));

      // Partition into valid and dropped
      const validEdges = allEdges.filter((e: any) => nodeIds.has(e.from) && nodeIds.has(e.to));
      const droppedCount = allEdges.length - validEdges.length;

      if (droppedCount > 0) {
        const dropped = allEdges.filter((e: any) => !nodeIds.has(e.from) || !nodeIds.has(e.to));
        for (const e of dropped) {
          console.warn(`[parseWebData] Dropped edge: "${e.from}" → "${e.to}" (node not found)`);
        }
      }

      return { webData: { nodes, edges: validEdges }, droppedEdges: droppedCount };
    } catch (e) {}
  }
  return null;
}

export function cleanMessage(text: string): string {
  // Strip JSON block from end — with or without --- separator
  let cleaned = text;
  for (const pattern of JSON_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  // Also catch any trailing JSON that starts with known keys
  cleaned = cleaned.replace(/\n?\{"conditions"[\s\S]*$/, "");
  cleaned = cleaned.replace(/\n?\{"nodes"[\s\S]*$/, "");
  cleaned = cleaned.replace(/\n?\{"organization_name"[\s\S]*$/, "");
  // Clean up trailing --- and whitespace
  cleaned = cleaned.replace(/\n---\s*$/, "");
  return cleaned.trim();
}
