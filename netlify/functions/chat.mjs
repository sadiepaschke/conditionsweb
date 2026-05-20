// Try primary model with one retry; on persistent transient overload, fall
// back to a secondary model. Different Gemini models have independent
// capacity buckets, so when the primary is hot the fallback usually isn't.
const MODEL_FALLBACK = ["gemini-2.5-flash", "gemini-2.0-flash"];
const RETRYABLE_HTTP = new Set([429, 500, 502, 503, 504]);
const RETRYABLE_STATUS = new Set(["UNAVAILABLE", "RESOURCE_EXHAUSTED", "INTERNAL"]);

export async function callGeminiWithFallback(apiKey, body) {
  const retryDelayMs = 1500;
  let lastResult = null;
  for (let m = 0; m < MODEL_FALLBACK.length; m++) {
    const model = MODEL_FALLBACK[m];
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      const apiStatus = data?.error?.status;
      const transient = RETRYABLE_HTTP.has(response.status) || RETRYABLE_STATUS.has(apiStatus);
      lastResult = { status: response.status, data, model };
      if (!transient) return lastResult;
      if (attempt === 0) {
        console.warn(`[${model}] transient (http=${response.status} status=${apiStatus}); retrying in ${retryDelayMs}ms`);
        await new Promise(r => setTimeout(r, retryDelayMs));
      } else if (m < MODEL_FALLBACK.length - 1) {
        console.warn(`[${model}] still transient after retry; falling back to ${MODEL_FALLBACK[m + 1]}`);
      }
    }
  }
  return lastResult;
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
    const body = await req.json();
    const { status, data } = await callGeminiWithFallback(apiKey, body);

    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to reach Gemini API" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};
