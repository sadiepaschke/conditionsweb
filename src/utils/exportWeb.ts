import type { WebData, ConditionNode, Edge } from "../types";

export function exportAsJSON(webData: WebData, filename = "conditions-web.json") {
  const data = {
    exported_at: new Date().toISOString(),
    conditions: webData.nodes.map(n => ({
      id: n.id,
      name: n.label,
      domain: n.domain,
      is_program_contribution: n.is_program_contribution || false,
      subpopulation: n.subpopulation || [],
      confidence: n.confidence || "explicit",
      felt_experience: n.felt_experience || null,
    })),
    connections: webData.edges.map(e => ({
      source_id: e.from,
      target_id: e.to,
      type: e.relationship,
    })),
  };
  downloadFile(JSON.stringify(data, null, 2), filename, "application/json");
}

export function exportAsCSV(webData: WebData, prefix = "conditions-web") {
  // Conditions CSV
  const condHeaders = ["id", "name", "domain", "is_program_contribution", "confidence", "felt_experience", "subpopulation"];
  const condRows = webData.nodes.map(n => [
    n.id,
    csvEscape(n.label),
    n.domain,
    n.is_program_contribution ? "true" : "false",
    n.confidence || "explicit",
    csvEscape(n.felt_experience || ""),
    (n.subpopulation || []).join("; "),
  ]);
  const condCSV = [condHeaders.join(","), ...condRows.map(r => r.join(","))].join("\n");

  // Connections CSV
  const connHeaders = ["source_id", "target_id", "type"];
  const connRows = webData.edges.map(e => [e.from, e.to, e.relationship]);
  const connCSV = [connHeaders.join(","), ...connRows.map(r => r.join(","))].join("\n");

  downloadFile(condCSV, `${prefix}-conditions.csv`, "text/csv");
  setTimeout(() => downloadFile(connCSV, `${prefix}-connections.csv`, "text/csv"), 100);
}

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
