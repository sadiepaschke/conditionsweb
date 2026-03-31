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

// Match JSON block at the end of text — with or without --- separator
const JSON_PATTERNS = [
  /---\s*(\{[\s\S]*\})\s*$/,              // standard: --- followed by JSON
  /\n(\{"conditions"[\s\S]*\})\s*$/,       // conditions JSON without ---
  /\n(\{"nodes"[\s\S]*\})\s*$/,            // nodes JSON without ---
  /\n(\{"organization_name"[\s\S]*\})\s*$/, // onboarding+conditions JSON without ---
];

export function parseWebData(text: string): WebData | null {
  for (const pattern of JSON_PATTERNS) {
    try {
      const match = text.match(pattern);
      if (!match) continue;

      const raw = JSON.parse(match[1]);
      if (!raw.conditions && !raw.nodes) continue;

      const rawNodes = raw.conditions || raw.nodes || [];
      const rawEdges = raw.connections || raw.edges || [];

      const nodes = rawNodes.map((n: any) => {
        const domain = n.domain || TYPE_TO_DOMAIN[n.type] || "situational";
        return {
          id: n.id,
          label: n.name || n.label,
          domain,
          is_program_contribution: n.is_program_contribution || n.type === "program" || false,
          subpopulation: n.subpopulation,
          confidence: n.confidence,
          felt_experience: n.felt_experience,
        };
      });

      const edges = rawEdges.map((e: any) => ({
        from: e.source_id || e.from,
        to: e.target_id || e.to,
        relationship: e.type || e.relationship,
      }));

      return { nodes, edges };
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
