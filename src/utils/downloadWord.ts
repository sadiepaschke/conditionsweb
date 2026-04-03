/**
 * Convert markdown text to a properly formatted Word document and trigger download.
 * Handles headings, bold, italic, lists (nested), numbered lists, horizontal rules,
 * and produces clean HTML that Word renders well.
 */
export function downloadAsWord(text: string, filename: string) {
  const html = markdownToWordHtml(text);

  const doc = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: 8.5in 11in;
    margin: 1in 1in 1in 1in;
  }
  body {
    font-family: 'Calibri', 'Segoe UI', sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
  }
  h1 {
    font-family: 'Cambria', 'Georgia', serif;
    font-size: 22pt;
    color: #1a3c5e;
    margin-top: 24pt;
    margin-bottom: 8pt;
    border-bottom: 2pt solid #c99d28;
    padding-bottom: 6pt;
  }
  h2 {
    font-family: 'Cambria', 'Georgia', serif;
    font-size: 16pt;
    color: #2a2a2a;
    margin-top: 20pt;
    margin-bottom: 6pt;
    border-bottom: 1pt solid #e0d8c8;
    padding-bottom: 4pt;
  }
  h3 {
    font-family: 'Cambria', 'Georgia', serif;
    font-size: 13pt;
    color: #7a5f15;
    margin-top: 16pt;
    margin-bottom: 4pt;
  }
  h4 {
    font-family: 'Calibri', sans-serif;
    font-size: 11pt;
    font-weight: bold;
    color: #444;
    margin-top: 12pt;
    margin-bottom: 4pt;
  }
  p {
    margin-top: 0;
    margin-bottom: 8pt;
  }
  ul, ol {
    margin-top: 4pt;
    margin-bottom: 8pt;
    padding-left: 24pt;
  }
  li {
    margin-bottom: 4pt;
    line-height: 1.5;
  }
  li ul, li ol {
    margin-top: 2pt;
    margin-bottom: 2pt;
  }
  strong {
    font-weight: bold;
    color: #111;
  }
  em {
    font-style: italic;
  }
  hr {
    border: none;
    border-top: 1pt solid #d0c8b0;
    margin: 16pt 0;
  }
  blockquote {
    margin: 8pt 0 8pt 16pt;
    padding: 4pt 12pt;
    border-left: 3pt solid #c99d28;
    color: #555;
    font-style: italic;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 8pt 0;
  }
  th, td {
    border: 1pt solid #ccc;
    padding: 6pt 8pt;
    text-align: left;
    font-size: 10pt;
  }
  th {
    background-color: #f5f0e6;
    font-weight: bold;
    color: #333;
  }
  .subtitle {
    font-size: 12pt;
    color: #888;
    margin-top: -4pt;
    margin-bottom: 16pt;
  }
</style>
</head>
<body>
${html}
</body>
</html>`;

  const blob = new Blob([doc], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert markdown text to HTML suitable for Word rendering.
 */
function markdownToWordHtml(md: string): string {
  let html = md;

  // Escape HTML entities in the source (but not our generated tags)
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Horizontal rules
  html = html.replace(/^---+$/gm, "<hr>");
  html = html.replace(/^\*\*\*+$/gm, "<hr>");

  // Headings (must come before bold/italic processing)
  html = html.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

  // Bold and italic (order matters: bold first, then italic)
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Blockquotes
  html = html.replace(/^&gt; (.*$)/gm, "<blockquote>$1</blockquote>");
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, "<br>");

  // Numbered lists: lines starting with "1. ", "2. ", etc.
  html = html.replace(/^(\d+)\. (.*$)/gm, "<oli>$2</oli>");
  // Group consecutive <oli> into <ol>
  html = html.replace(/((?:<oli>.*<\/oli>\n?)+)/g, (match) => {
    const items = match.replace(/<oli>(.*?)<\/oli>/g, "<li>$1</li>");
    return `<ol>${items}</ol>`;
  });

  // Unordered lists: handle nested levels (  - and    - patterns)
  // First, process deeply nested items (4+ spaces or 2+ tabs)
  html = html.replace(/^(?:    |\t\t)[-*] (.*$)/gm, "<li3>$1</li3>");
  html = html.replace(/^(?:  |\t)[-*] (.*$)/gm, "<li2>$1</li2>");
  html = html.replace(/^[-*] (.*$)/gm, "<li1>$1</li1>");

  // Build nested list structure
  html = buildNestedLists(html);

  // Paragraphs: double newlines become paragraph breaks
  // Split on double newlines, wrap non-tag content in <p>
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap if already a block element
      if (/^<(h[1-4]|ul|ol|li|hr|blockquote|table|p|div)/.test(trimmed)) {
        return trimmed;
      }
      // Convert single newlines to <br> within paragraphs
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return html;
}

/**
 * Convert tagged list items into proper nested HTML lists.
 */
function buildNestedLists(html: string): string {
  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;
  let listStack: number[] = [];

  for (const line of lines) {
    const match = line.match(/^<li(\d)>(.*)<\/li\d>$/);
    if (match) {
      const level = parseInt(match[1]);
      const content = match[2];

      if (!inList) {
        result.push("<ul>");
        listStack = [1];
        inList = true;
      }

      const currentLevel = listStack.length;
      if (level > currentLevel) {
        // Open nested list(s)
        for (let i = currentLevel; i < level; i++) {
          result.push("<ul>");
          listStack.push(i + 1);
        }
      } else if (level < currentLevel) {
        // Close nested list(s)
        for (let i = currentLevel; i > level; i--) {
          result.push("</ul>");
          listStack.pop();
        }
      }
      result.push(`<li>${content}</li>`);
    } else {
      // Close all open lists
      if (inList) {
        while (listStack.length > 0) {
          result.push("</ul>");
          listStack.pop();
        }
        inList = false;
      }
      result.push(line);
    }
  }

  // Close any remaining open lists
  while (listStack.length > 0) {
    result.push("</ul>");
    listStack.pop();
  }

  return result.join("\n");
}
