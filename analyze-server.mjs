// Standalone analyze server — runs alongside netlify dev
// Handles document upload + Gemini analysis without the 30s function timeout
import express from "express";
import multer from "multer";
import { createRequire } from "module";
import dotenv from "dotenv";
dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.post("/api/analyze", upload.array("files", 20), async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set in .env" });

  try {
    const files = req.files || [];
    const urls = JSON.parse(req.body.urls || "[]");
    const textParts = [];

    for (const file of files) {
      const ext = file.originalname.split(".").pop()?.toLowerCase() || "";
      const buffer = file.buffer;
      try {
        if (ext === "pdf") {
          const data = await pdfParse(buffer);
          console.log(`  PDF "${file.originalname}": ${data.text.length} chars`);
          textParts.push(`--- ${file.originalname} ---\n${data.text}\n`);
        } else if (ext === "docx") {
          const result = await mammoth.extractRawText({ buffer });
          console.log(`  DOCX "${file.originalname}": ${result.value.length} chars`);
          textParts.push(`--- ${file.originalname} ---\n${result.value}\n`);
        } else {
          const text = buffer.toString("utf-8");
          console.log(`  Text "${file.originalname}": ${text.length} chars`);
          textParts.push(`--- ${file.originalname} ---\n${text}\n`);
        }
      } catch (e) {
        console.error(`  Failed to parse ${file.originalname}:`, e.message);
        textParts.push(`--- ${file.originalname} ---\n[Could not parse: ${e.message}]\n`);
      }
    }

    for (const url of urls) {
      try {
        const r = await fetch(url, { headers: { "User-Agent": "ConditionsWeb/1.0" } });
        if (r.ok) {
          const body = await r.text();
          const stripped = body.replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          console.log(`  URL "${url}": ${stripped.length} chars`);
          textParts.push(`--- ${url} ---\n${stripped}\n`);
        }
      } catch (e) {
        textParts.push(`--- ${url} ---\n[Failed to fetch]\n`);
      }
    }

    let combined = textParts.join("\n\n");
    if (combined.length > 80000) {
      console.log(`  Truncating from ${combined.length} to 80000 chars`);
      combined = combined.substring(0, 80000) + "\n\n[... truncated ...]";
    }

    console.log(`Sending ${combined.length} chars to Gemini...`);

    const prompt = `You are analyzing background documents for a social impact organization that is about to map its Conditions Web.

Read the following documents and produce a situational analysis covering:
1. Organization overview
2. Program description
3. Target population
4. Geography and context
5. Key conditions already visible (organized by: Historical & Systemic, Situational, Population, Community & Cultural, Structural & Political, Organizational & Institutional, Market & Exchange, Ecological & Place-Based)
6. Relationships visible between conditions
7. Gaps the conversation should explore

Use plain language. Be specific. Quote the documents when useful.

---
DOCUMENTS:

${combined}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8000 },
        }),
      }
    );

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log(`Analysis complete: ${analysis.length} chars`);

    res.json({ analysis, sources: { files: files.map(f => f.originalname), urls }, textLength: combined.length });
  } catch (err) {
    console.error("Analysis error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3002;
app.listen(PORT, () => console.log(`Analyze server on http://localhost:${PORT}`));
