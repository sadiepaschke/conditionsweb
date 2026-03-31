export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files");
    const urlsRaw = formData.get("urls") || "[]";
    const urls = JSON.parse(urlsRaw);

    // Use Gemini's native file handling — send files as inline data parts
    const parts = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (ext === "pdf") {
        // Send PDF as inline data to Gemini — it can read PDFs natively
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: buffer.toString("base64"),
          },
        });
      } else if (ext === "docx") {
        // Send DOCX as inline data
        parts.push({
          inlineData: {
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            data: buffer.toString("base64"),
          },
        });
      } else {
        // Text files — send as text
        const text = buffer.toString("utf-8");
        parts.push({ text: `--- ${file.name} ---\n${text}\n` });
      }
    }

    // Fetch URLs
    const urlTexts = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "ConditionsWeb/1.0" },
        });
        if (res.ok) {
          const body = await res.text();
          const stripped = body
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          urlTexts.push(`--- ${url} ---\n${stripped}\n`);
        } else {
          urlTexts.push(`--- ${url} ---\n[Failed to fetch: ${res.status}]\n`);
        }
      } catch (e) {
        urlTexts.push(`--- ${url} ---\n[Failed to fetch: ${e.message}]\n`);
      }
    }

    if (files.length === 0 && urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files or URLs provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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

    // Build content parts: prompt text + file data
    const contentParts = [{ text: analysisPrompt }, ...parts];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: contentParts }],
          generationConfig: { maxOutputTokens: 8000 },
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini response status:", response.status);
    console.log("Gemini response data:", JSON.stringify(data).slice(0, 500));
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!analysis) {
      console.error("No analysis text. Full response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Gemini returned no analysis. The document may be too large or unreadable.", debug: data }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        analysis,
        sources: {
          files: files.map((f) => f.name),
          urls,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Analysis failed: " + err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
