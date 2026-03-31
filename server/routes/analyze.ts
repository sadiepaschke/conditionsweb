import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as cheerio from "cheerio";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const ANALYSIS_PROMPT = `You are analyzing background documents for a social impact organization that is about to map its Conditions Web — a relational map of the conditions within which the organization and the people it serves exist.

Read the following documents carefully and produce a situational analysis covering:

1. **Organization overview** — name, mission, how they describe themselves, organizational structure if mentioned
2. **Program description** — what they do, how they deliver it, what the model looks like
3. **Target population** — who they serve, demographics, circumstances, any variation or subgroups mentioned
4. **Geography and context** — where the work happens, what's true about that place
5. **Key conditions already visible** — organize what you find by these eight domains (use domain names as headers):
   - Historical & Systemic — long-arc forces that produced the situation
   - Situational — what's happening right now in the environment
   - Population — conditions characterizing the people served
   - Community & Cultural — informal networks, cultural practices, community assets
   - Structural & Political — rules, policies, governance, power structures
   - Organizational & Institutional — conditions within/between formal organizations
   - Market & Exchange — economic conditions, costs, labor, financial access
   - Ecological & Place-Based — physical environment, infrastructure, housing, land
6. **Relationships visible between conditions** — where documents show one condition producing, enabling, or blocking another
7. **What the documents don't cover** — gaps the conversation should explore

Use plain language. Be specific. Quote the documents when useful. If a domain has no relevant content in the documents, say so briefly.

---

DOCUMENTS:

`;

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const ext = file.originalname.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf") {
    const data = await pdfParse(file.buffer);
    return `--- ${file.originalname} ---\n${data.text}\n`;
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return `--- ${file.originalname} ---\n${result.value}\n`;
  }

  // TXT, MD, CSV — read as UTF-8
  return `--- ${file.originalname} ---\n${file.buffer.toString("utf-8")}\n`;
}

async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ConditionsWeb/1.0 (document analysis)" },
    });
    if (!response.ok) return `--- ${url} ---\n[Failed to fetch: ${response.status}]\n`;

    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();

    if (contentType.includes("text/html")) {
      const $ = cheerio.load(body);
      // Remove scripts, styles, nav, footer
      $("script, style, nav, footer, header, aside, iframe").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim();
      return `--- ${url} ---\n${text}\n`;
    }

    return `--- ${url} ---\n${body}\n`;
  } catch (e: any) {
    return `--- ${url} ---\n[Failed to fetch: ${e.message}]\n`;
  }
}

router.post("/", upload.array("files", 20), async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const urls: string[] = JSON.parse(req.body.urls || "[]");

    if (!files.length && !urls.length) {
      return res.status(400).json({ error: "No files or URLs provided" });
    }

    // Extract text from all sources
    const textParts: string[] = [];

    for (const file of files) {
      const text = await extractTextFromFile(file);
      textParts.push(text);
    }

    for (const url of urls) {
      const text = await extractTextFromUrl(url);
      textParts.push(text);
    }

    const combinedText = textParts.join("\n\n");
    const fullPrompt = ANALYSIS_PROMPT + combinedText;

    // Send to Gemini for analysis
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig: { maxOutputTokens: 8000 },
        }),
      }
    );

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!analysis) {
      return res.status(502).json({ error: "No analysis generated" });
    }

    res.json({
      analysis,
      sources: {
        files: files.map(f => f.originalname),
        urls,
      },
      textLength: combinedText.length,
    });
  } catch (err: any) {
    console.error("Analysis error:", err);
    res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

export default router;
