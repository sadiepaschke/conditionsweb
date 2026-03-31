import { Router } from "express";
import { getWeb } from "../db/queries/webs.js";
import { getProgramPathways, getHighLeverageConditions } from "../db/queries/graph.js";
import { getConnectionDensity } from "../db/queries/connections.js";

const router = Router();

// Generate a deliverable
router.post("/:id/deliverables/:type", async (req, res) => {
  const { id, type } = req.params;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const web = await getWeb(id);
    if (!web) return res.status(404).json({ error: "Web not found" });

    let prompt: string;
    let additionalData: any = {};

    switch (type) {
      case "narrative": {
        prompt = buildNarrativePrompt(web);
        break;
      }
      case "toc": {
        const pathways = await getProgramPathways(id);
        additionalData.pathways = pathways;
        prompt = buildTocPrompt(web, pathways);
        break;
      }
      case "logic-model": {
        const pathways = await getProgramPathways(id);
        additionalData.pathways = pathways;
        prompt = buildLogicModelPrompt(web, pathways);
        break;
      }
      case "checklist": {
        const density = await getConnectionDensity(id);
        const leverage = await getHighLeverageConditions(id);
        const result = buildChecklist(web, density, leverage);
        return res.json({ type: "checklist", content: result });
      }
      default:
        return res.status(400).json({ error: `Unknown deliverable type: ${type}` });
    }

    // Call Gemini to generate the deliverable
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4000 },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({ type, content: text, additionalData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function buildNarrativePrompt(web: any): string {
  const { metadata, conditions, connections } = web;
  const domainGroups: Record<string, any[]> = {};
  for (const c of conditions) {
    if (!domainGroups[c.domain]) domainGroups[c.domain] = [];
    domainGroups[c.domain].push(c);
  }

  return `You are generating a narrative summary of a Conditions Web for ${metadata.org_name}'s ${metadata.program_name}.

The web contains ${conditions.length} conditions across ${Object.keys(domainGroups).length} domains and ${connections.length} connections.

Target population: ${metadata.target_population}
Geography: ${metadata.geography}

Conditions by domain:
${Object.entries(domainGroups).map(([domain, conds]) =>
  `${domain}: ${(conds as any[]).map((c: any) => c.name).join(", ")}`
).join("\n")}

Connections:
${connections.map((c: any) => `${c.source_ai_id} ${c.type} ${c.target_ai_id}`).join("\n")}

Program contributions: ${conditions.filter((c: any) => c.is_program_contribution).map((c: any) => c.name).join(", ") || "None identified"}

Write a plain-language narrative summary organized by domain. Cover:
- What conditions were surfaced in each domain
- Where the major clusters of connected conditions are
- Which conditions have the highest connection counts (high-leverage)
- What subpopulation variation was identified
- What domains were lightly covered or have gaps

Be honest about gaps. Use warm, plain language. Do not use jargon. Write 3-5 paragraphs.`;
}

function buildTocPrompt(web: any, pathways: any[]): string {
  const { metadata, conditions, connections } = web;
  const programConditions = conditions.filter((c: any) => c.is_program_contribution);

  return `You are generating a Theory of Change from a Conditions Web for ${metadata.org_name}'s ${metadata.program_name}.

The Theory of Change traces from program contributions through the conditions web to the changes the organization seeks.

Program contributions:
${programConditions.map((c: any) => `- ${c.name} (${c.domain})`).join("\n") || "None identified"}

All conditions:
${conditions.map((c: any) => `- ${c.ai_node_id}: ${c.name} (${c.domain})`).join("\n")}

Connections:
${connections.map((c: any) => `${c.source_ai_id} --[${c.type}]--> ${c.target_ai_id}`).join("\n")}

${pathways.length ? `Graph pathways from program contributions:\n${JSON.stringify(pathways, null, 2)}` : ""}

Generate a Theory of Change that:
1. Starts with what the program contributes
2. Traces outward through the connection graph: what do contributions enable, address, or partially address?
3. Shows the simplified causal pathways from program contributions to the changes sought
4. Notes what the program depends on that it does not control
5. Acknowledges that this is a simplification — the web is more complex than any linear pathway

Format as a structured document with clear sections. Use the organization's language. Keep it concise and readable.`;
}

function buildLogicModelPrompt(web: any, pathways: any[]): string {
  const { metadata, conditions, connections } = web;
  const programConditions = conditions.filter((c: any) => c.is_program_contribution);

  return `You are generating a Logic Model from a Conditions Web for ${metadata.org_name}'s ${metadata.program_name}.

Map the conditions web into the standard logic model format:
- INPUTS: Resources and conditions the program requires to operate
- ACTIVITIES: What the program does (conditions it actively creates)
- OUTPUTS: Direct products of program activities
- OUTCOMES: Downstream changes the program contributes to

Program contributions:
${programConditions.map((c: any) => `- ${c.name} (${c.domain})`).join("\n") || "None identified"}

All conditions:
${conditions.map((c: any) => `- ${c.ai_node_id}: ${c.name} (${c.domain})${c.is_program_contribution ? " [program]" : ""}`).join("\n")}

Connections:
${connections.map((c: any) => `${c.source_ai_id} --[${c.type}]--> ${c.target_ai_id}`).join("\n")}

Generate a logic model that:
1. Maps conditions into inputs, activities, outputs, and outcomes
2. Makes reasonable assignments, flagging ambiguous cases
3. Notes that this is a translation artifact — it simplifies the web into a linear format
4. Uses the organization's language

Format as a structured table with four columns. Keep it concise.`;
}

function buildChecklist(web: any, density: any[], leverage: any[]): any {
  const { metadata, conditions, connections } = web;

  // Domain coverage
  const domainCounts: Record<string, number> = {};
  for (const c of conditions) {
    domainCounts[c.domain] = (domainCounts[c.domain] || 0) + 1;
  }

  const allDomains = ["historical", "situational", "population", "community",
    "structural", "organizational", "market", "ecological"];
  const missingDomains = allDomains.filter(d => !domainCounts[d]);
  const lightDomains = allDomains.filter(d => domainCounts[d] && domainCounts[d] < 2);

  // Orphan nodes (no connections)
  const connectedIds = new Set<string>();
  for (const c of connections) {
    connectedIds.add(c.source_id);
    connectedIds.add(c.target_id);
  }
  const orphans = conditions.filter((c: any) => !connectedIds.has(c.id));

  // AI-suggested conditions not confirmed
  const suggested = conditions.filter((c: any) => c.confidence === "suggested_by_ai");

  // Program contributions
  const programConditions = conditions.filter((c: any) => c.is_program_contribution);

  return {
    total_conditions: conditions.length,
    total_connections: connections.length,
    domain_coverage: domainCounts,
    missing_domains: missingDomains,
    light_domains: lightDomains,
    orphan_conditions: orphans.map((c: any) => ({ id: c.ai_node_id, name: c.name })),
    unconfirmed_suggestions: suggested.map((c: any) => ({ id: c.ai_node_id, name: c.name })),
    program_contributions: programConditions.length,
    high_leverage: leverage,
    ontological_frame: metadata.ontological_frame,
    checks: {
      all_domains_covered: missingDomains.length === 0,
      no_orphan_conditions: orphans.length === 0,
      has_program_contributions: programConditions.length > 0,
      subpopulation_explored: conditions.some((c: any) => c.subpopulation?.length > 0),
      ecological_if_relevant: metadata.ontological_frame !== "ecological_relational" ||
        (domainCounts["ecological"] || 0) >= 2,
      spiritual_if_relevant: metadata.ontological_frame !== "spiritual_ceremonial" || true,
    },
  };
}

export default router;
