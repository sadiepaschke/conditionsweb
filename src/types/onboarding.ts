export type OntologicalFrame =
  | "human_systems"
  | "ecological_relational"
  | "spiritual_ceremonial"
  | "mixed";

export type WebScope = "organizational" | "program";

export interface WebMetadata {
  org_name: string;
  program_name: string;
  target_population: string;
  geography: string;
  sector: string;
  ontological_frame: OntologicalFrame;
  scope: WebScope;
}

export const ORG_DOMAINS = [
  "situational", "population", "organizational", "market",
  "structural", "historical", "community", "ecological",
] as const;

export const PROGRAM_DOMAINS = [
  "historical", "situational", "population", "community",
  "structural", "organizational", "market", "ecological",
] as const;
