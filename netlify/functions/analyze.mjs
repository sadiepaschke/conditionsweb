// Accepts pre-uploaded file URIs and generates analysis
// Files are uploaded separately via upload-file function
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
    const { files, urls = [] } = await req.json();
    // files: [{ type: "file", name, uri, mimeType } | { type: "text", name, content }]

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

    // Fetch URLs
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

    // Stream response
    const metaEvent = `data: ${JSON.stringify({ type: "meta", files: fileNames, urls })}\n\n`;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(metaEvent));
        const reader = geminiResponse.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Analysis failed: " + err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/.netlify/functions/analyze",
  stream: true,
};
