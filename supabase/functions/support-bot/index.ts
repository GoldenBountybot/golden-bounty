
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function pickKey() {
  const names = ["GEMINI_API_KEY", "OPENAI_API_KEY", "Bounty Bot", "BOUNTY_BOT", "LLM_API_KEY"];
  for (const n of names) {
    const v = (Deno.env.get(n) || "").trim();
    if (v) return v;
  }
  return "";
}

async function askGemini(key: string, prompt: string) {
  const models = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-flash-latest"];
  let lastErr = "";
  for (const m of models) {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + m + ":generateContent?key=" + key;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    const j = await r.json();
    if (r.ok) {
      return (j?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("").trim();
    }
    lastErr = j?.error?.message || "gemini failed";
  }
  throw new Error(lastErr);
}

async function askOpenAI(key: string, prompt: string) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.6 }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || "openai failed");
  return (j?.choices?.[0]?.message?.content || "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { prompt } = await req.json();
    if (!prompt) return json({ error: "prompt required" }, 400);
    const key = pickKey();
    if (!key) return json({ error: "No LLM API key configured" }, 503);
    const reply = key.startsWith("sk-") ? await askOpenAI(key, prompt) : await askGemini(key, prompt);
    if (!reply) return json({ error: "empty reply" }, 502);
    return json({ reply });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
