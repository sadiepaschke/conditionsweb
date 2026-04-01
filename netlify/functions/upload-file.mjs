// Upload a file to Gemini File API and return the file URI
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
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = ext === "pdf" ? "application/pdf"
      : ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "text/plain";

    // For text files, return the text directly
    if (ext === "txt" || ext === "md" || ext === "csv") {
      return new Response(JSON.stringify({
        type: "text",
        name: file.name,
        content: buffer.toString("utf-8"),
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Upload binary files to Gemini File API
    const uploadRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": mimeType,
          "X-Goog-Upload-Command": "upload, finalize",
          "X-Goog-Upload-Header-Content-Length": buffer.length.toString(),
          "X-Goog-Upload-Header-Content-Type": mimeType,
          "X-Goog-Upload-Protocol": "raw",
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Upload failed:", errText);
      return new Response(JSON.stringify({ error: "File upload failed" }), {
        status: 502, headers: { "Content-Type": "application/json" },
      });
    }

    const uploadData = await uploadRes.json();
    return new Response(JSON.stringify({
      type: "file",
      name: file.name,
      uri: uploadData.file?.uri,
      mimeType,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
