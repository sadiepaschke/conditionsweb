export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { type, conditions, connections, metadata } = await req.json();

    const domainGroups = {};
    for (const c of conditions) {
      if (!domainGroups[c.domain]) domainGroups[c.domain] = [];
      domainGroups[c.domain].push(c);
    }

    const programConditions = conditions.filter(c => c.is_program_contribution);
    const conditionsList = conditions.map(c => `- ${c.id}: ${c.label || c.name} (${c.domain})${c.is_program_contribution ? " [program]" : ""}`).join("\n");
    const connectionsList = connections.map(e => `${e.from || e.source_id} --[${e.relationship || e.type}]--> ${e.to || e.target_id}`).join("\n");

    let prompt;

    if (type === "narrative") {
      prompt = `You are generating a narrative summary of a Conditions Web.

The web contains ${conditions.length} conditions across ${Object.keys(domainGroups).length} domains and ${connections.length} connections.

Conditions by domain:
${Object.entries(domainGroups).map(([d, cs]) => `${d}: ${cs.map(c => c.label || c.name).join(", ")}`).join("\n")}

Connections:
${connectionsList}

Program contributions: ${programConditions.map(c => c.label || c.name).join(", ") || "None identified"}

Write a plain-language narrative summary organized by domain. Cover what conditions were surfaced, where the major clusters are, which have the highest connections, what subpopulation variation was identified, and what domains were lightly covered. Be honest about gaps. 3-5 paragraphs.`;

    } else if (type === "toc") {
      prompt = `You are generating a Theory of Change from a Conditions Web.

Program contributions:
${programConditions.map(c => `- ${c.label || c.name} (${c.domain})`).join("\n") || "None identified"}

All conditions:
${conditionsList}

Connections:
${connectionsList}

Generate a Theory of Change that:
1. Starts with what the program contributes
2. Traces outward through connections to downstream changes
3. Notes what the program depends on that it does not control
4. Acknowledges this is a simplification of the web

Format as a structured document. Use plain language. Keep it concise.`;

    } else if (type === "logic-model") {
      prompt = `You are generating a Logic Model from a Conditions Web.

Map conditions into: INPUTS (resources required), ACTIVITIES (what program does), OUTPUTS (direct products), OUTCOMES (downstream changes).

Program contributions:
${programConditions.map(c => `- ${c.label || c.name} (${c.domain})`).join("\n") || "None identified"}

All conditions:
${conditionsList}

Connections:
${connectionsList}

Generate a logic model. Flag ambiguous assignments. Note this is a translation artifact. Format as a structured table with four columns.`;

    } else if (type === "checklist") {
      // Checklist is computed, not AI-generated
      const missingDomains = ["historical", "situational", "population", "community", "structural", "organizational", "market", "ecological"]
        .filter(d => !domainGroups[d]);
      const lightDomains = Object.entries(domainGroups).filter(([, cs]) => cs.length < 2).map(([d]) => d);

      const connectedIds = new Set();
      for (const c of connections) {
        connectedIds.add(c.from || c.source_id);
        connectedIds.add(c.to || c.target_id);
      }
      const orphans = conditions.filter(c => !connectedIds.has(c.id));

      return new Response(JSON.stringify({
        type: "checklist",
        content: {
          total_conditions: conditions.length,
          total_connections: connections.length,
          domain_coverage: Object.fromEntries(Object.entries(domainGroups).map(([d, cs]) => [d, cs.length])),
          missing_domains: missingDomains,
          light_domains: lightDomains,
          orphan_conditions: orphans.map(c => ({ id: c.id, name: c.label || c.name })),
          program_contributions: programConditions.length,
          checks: {
            all_domains_covered: missingDomains.length === 0,
            no_orphan_conditions: orphans.length === 0,
            has_program_contributions: programConditions.length > 0,
            subpopulation_explored: conditions.some(c => c.subpopulation?.length > 0),
          },
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    } else {
      return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

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
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ type, content }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
