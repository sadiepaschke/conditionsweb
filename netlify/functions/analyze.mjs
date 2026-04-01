import { stream } from "@netlify/functions";
import { Readable } from "stream";

export default stream(async (event) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  try {
    const { files, urls = [] } = JSON.parse(event.body || "{}");

    const parts = [];
    const fileNames = [];

    for (const f of files) {
      fileNames.push(f.name);
      if (f.type === "text") {
        parts.push({ text: `--- ${f.name} ---\n${f.content}\n` });
      } else if (f.uri) {
        parts.push({ fileData: { mimeType: f.mimeType, fileUri: f.uri } });
      }
    }

    const urlTexts = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "ConditionsWeb/1.0" } });
        if (res.ok) {
          const body = await res.text();
          const stripped = body
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          urlTexts.push(`--- ${url} ---\n${stripped}\n`);
        }
      } catch (e) { /* skip */ }
    }

    const analysisPrompt = `You are analyzing background documents for a social impact organization that is about to map its Conditions Web — a relational map of the conditions within which the organization and the people it serves exist.

Read the following documents carefully and produce a situational analysis covering:

1. **Organization overview** — name, mission, how they describe themselves, organizational structure if mentioned
2. **Program description** — what they do, how they deliver it, what the model looks like
3. **Target population** — who they serve, demographics, circumstances, any variation or subgroups mentioned
4. **Geography and context** — where the work happens, what's true about that place
5. **Key conditions already visible** — organize what you find by these eight domains (use domain names as headers):
   - Historical & Systemic
   - Situational
   - Population
   - Community & Cultural
   - Structural & Political
   - Organizational & Institutional
   - Market & Exchange
   - Ecological & Place-Based
6. **Relationships visible between conditions**
7. **What the documents don't cover** — gaps the conversation should explore

Use plain language. Be specific. Quote the documents when useful.

${urlTexts.length > 0 ? "---\n\nURL CONTENT:\n\n" + urlTexts.join("\n\n") : ""}`;

    const contentParts = [{ text: analysisPrompt }, ...parts];

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: contentParts }],
          generationConfig: { maxOutputTokens: 8000 },
        }),
      }
    );

    // Create a Node.js Readable stream that pipes Gemini's response
    const nodeStream = new Readable({
      read() {},
    });

    // Push metadata first
    nodeStream.push(`data: ${JSON.stringify({ type: "meta", files: fileNames, urls })}\n\n`);

    // Pipe Gemini response chunks
    (async () => {
      const reader = geminiResponse.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          nodeStream.push(decoder.decode(value, { stream: true }));
        }
      } finally {
        nodeStream.push(null); // signal end
      }
    })();

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/event-stream" },
      body: nodeStream,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Analysis failed: " + err.message }),
    };
  }
});
