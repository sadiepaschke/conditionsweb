import type { Domain, EdgeRelationship, NodeColorSet } from "../types";

export const NODE_COLORS: Record<Domain, NodeColorSet> = {
  historical:     { bg: "#3D405B", light: "#EEEEF4", border: "#6D7099" },
  situational:    { bg: "#C99D28", light: "#FDF6E3", border: "#e8c86a" },
  population:     { bg: "#7A6A4A", light: "#F2EEE6", border: "#a89870" },
  community:      { bg: "#6B8F71", light: "#EEF3EE", border: "#92b898" },
  structural:     { bg: "#8B4513", light: "#F4EDE6", border: "#b06838" },
  organizational: { bg: "#8B7355", light: "#F2EDE6", border: "#b09878" },
  market:         { bg: "#B08D57", light: "#F6F0E4", border: "#c9ab78" },
  ecological:     { bg: "#81B29A", light: "#EEF4F1", border: "#a8ccb8" },
};

export const DOMAIN_LABELS: Record<Domain, string> = {
  historical:     "Historical & Systemic",
  situational:    "Situational",
  population:     "Population",
  community:      "Community & Cultural",
  structural:     "Structural & Political",
  organizational: "Organizational & Institutional",
  market:         "Market & Exchange",
  ecological:     "Ecological & Place-Based",
};

export const EDGE_COLORS: Record<EdgeRelationship, string> = {
  produces:            "#888888",
  maintains:           "#777777",
  enables:             "#cbb26a",
  constrains:          "#9e7c5a",
  blocks:              "#8B4513",
  amplifies:           "#c99d28",
  depends_on:          "#7a6a4a",
  addresses:           "#8a9e7a",
  partially_addresses: "#b0c4a0",
};
