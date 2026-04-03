export type Domain =
  | "historical"
  | "situational"
  | "population"
  | "community"
  | "structural"
  | "organizational"
  | "market"
  | "ecological";

export type EdgeRelationship =
  | "produces"
  | "maintains"
  | "enables"
  | "constrains"
  | "blocks"
  | "amplifies"
  | "depends_on"
  | "addresses"
  | "partially_addresses";

export type Confidence = "explicit" | "inferred" | "suggested_by_ai";

export interface ConditionNode {
  id: string;
  label: string;
  domain: Domain;
  is_program_contribution?: boolean;
  subpopulation?: string[];
  confidence?: Confidence;
  felt_experience?: string;
  source?: "ai" | "manual";
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Edge {
  from: string;
  to: string;
  relationship: EdgeRelationship;
}

export interface SimEdge {
  source: string | ConditionNode;
  target: string | ConditionNode;
  relationship: EdgeRelationship;
  index?: number;
}

export interface WebData {
  nodes: ConditionNode[];
  edges: Edge[];
}

export interface Message {
  role: "user" | "assistant";
  text: string;
}

export interface ThemeTokens {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  textDim: string;
  gold: string;
  border: string;
  borderAccent: string;
}

export interface NodeColorSet {
  bg: string;
  light: string;
  border: string;
}

// Logic Model types
export interface LogicModelItem {
  id: string;
  label: string;
  note?: string;
  reason?: string;
}

export interface LogicModelColumn {
  id: string;
  label: string;
  items: LogicModelItem[];
}

export interface LogicModelData {
  columns: LogicModelColumn[];
  flows: { from: string; to: string; label?: string }[];
  assumptions: string[];
  external_factors: string[];
  unmapped: LogicModelItem[];
}
