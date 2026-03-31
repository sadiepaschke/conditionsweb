import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mammoth = require("mammoth");

// pdf-parse has a bug where index.js tries to read a test file on import.
// We lazy-load it inside the handler to catch and ignore that error.
let pdfParse = null;
async function getPdfParse() {
  if (pdfParse) return pdfParse;
  try {
    pdfParse = require("pdf-parse");
  } catch {
    // If the test file error occurs, require the inner module directly
    const mod = await import("pdf-parse");
    pdfParse = mod.default || mod;
  }
  return pdfParse;
}

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

    const textParts = [];

    // Extract text from uploaded files
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      try {
        console.log(`Processing file: ${file.name} (${ext}), buffer size: ${buffer.length}`);
        if (ext === "pdf") {
          const parsePdf = await getPdfParse();
          const data = await parsePdf(buffer);
          console.log(`PDF extracted: ${data.text.length} chars`);
          textParts.push(`--- ${file.name} ---\n${data.text}\n`);
        } else if (ext === "docx") {
          const result = await mammoth.extractRawText({ buffer });
          console.log(`DOCX extracted: ${result.value.length} chars`);
          textParts.push(`--- ${file.name} ---\n${result.value}\n`);
        } else {
          const text = buffer.toString("utf-8");
          console.log(`Text file: ${text.length} chars`);
          textParts.push(`--- ${file.name} ---\n${text}\n`);
        }
      } catch (parseErr) {
        console.error(`Failed to parse ${file.name}:`, parseErr.message);
        textParts.push(`--- ${file.name} ---\n[Could not parse file: ${parseErr.message}]\n`);
      }
    }

    // Fetch URLs
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
          textParts.push(`--- ${url} ---\n${stripped}\n`);
        } else {
          textParts.push(`--- ${url} ---\n[Failed to fetch: ${res.status}]\n`);
        }
      } catch (e) {
        textParts.push(`--- ${url} ---\n[Failed to fetch: ${e.message}]\n`);
      }
    }

    // Cap total text to avoid Gemini timeout — 50K chars is plenty for analysis
    const MAX_TEXT = 50000;
    let combinedRaw = textParts.join("\n\n");
    if (combinedRaw.length > MAX_TEXT) {
      console.log(`Truncating from ${combinedRaw.length} to ${MAX_TEXT} chars`);
      combinedRaw = combinedRaw.substring(0, MAX_TEXT) + "\n\n[... document truncated for analysis ...]";
    }

    if (textParts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No content could be extracted from the provided sources." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const combinedText = combinedRaw;

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

---

DOCUMENTS:

${combinedText}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
          generationConfig: { maxOutputTokens: 8000 },
        }),
      }
    );

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(
      JSON.stringify({
        analysis,
        sources: {
          files: files.map((f) => f.name),
          urls,
        },
        textLength: combinedText.length,
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
