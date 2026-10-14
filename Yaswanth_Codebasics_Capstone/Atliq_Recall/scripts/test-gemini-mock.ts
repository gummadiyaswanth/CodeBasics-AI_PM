// Offline test of the Gemini code path with a mocked fetch (no network, no key needed).
process.env.GEMINI_API_KEY = "test-key";
delete process.env.ANTHROPIC_API_KEY;
const { extract, complete } = await import("../api/_lib");
const { provider, models } = await import("../api/_prompts");

const text = "Just spoke to Neha at GlobalMart. She wants the revised proposal by Wednesday the 15th. I'll send it by Tuesday.";
let captured: any = null;
(globalThis as any).fetch = async (url: string, init: any) => {
  captured = { url, headers: init.headers, body: JSON.parse(init.body) };
  const json = {
    company: "GlobalMart", contact_name: "Neha Shah", contact_email: null,
    signals: [
      { type: "client_request", summary: "Revised proposal by 15 Jul", quote: "She wants the revised proposal by Wednesday the 15th.", due: "2026-07-15", owner: "Karandeep", waiting_on: "us", value_usd: null },
      { type: "commitment", summary: "Send by Tuesday", quote: "I'll send it by Tuesday.", due: "Tuesday", owner: "Karandeep", waiting_on: "us", value_usd: null },
      { type: "budget", summary: "Invented", quote: "Budget is 80k", due: null, owner: null, waiting_on: null, value_usd: 80000 },
      { type: "made_up_type", summary: "x", quote: "Neha", due: null, owner: null, waiting_on: null, value_usd: null },
    ],
  };
  const reply = { candidates: [{ content: { parts: [{ text: "```json\n" + JSON.stringify(json) + "\n```" }] } }], usageMetadata: { promptTokenCount: 1500, candidatesTokenCount: 300 } };
  return new Response(JSON.stringify(reply), { status: 200, headers: { "content-type": "application/json" } });
};

const r = await extract(text, "voice_memo", "2026-07-10", ["GlobalMart"]);
const ok = (c: boolean, m: string) => { console.log(c ? "PASS" : "FAIL", m); if (!c) process.exitCode = 1; };
ok(provider() === "gemini", `provider = gemini (${models().extract})`);
ok(captured.url.includes(`models/${models().extract}:generateContent`), "calls generateContent on the extract model");
ok(captured.headers["x-goog-api-key"] === "test-key", "key sent in header, not URL");
ok(captured.body.generationConfig.responseMimeType === "application/json", "JSON mode on");
ok(captured.body.systemInstruction.parts[0].text.includes("Return ONLY a JSON object"), "schema in system prompt");
ok(r.signals.length === 2, `kept 2 grounded signals (got ${r.signals.length})`);
ok(r.dropped.length === 2, `dropped invented quote + unknown type (got ${r.dropped.length})`);
ok(r.signals[1].due === null, "unparseable date 'Tuesday' set to null, not guessed");
ok(r.usage.input_tokens === 1500 && r.usage.output_tokens === 300, "usage mapped");

// Busy primary model: falls back to the next free model and reports which one answered.
const tried: string[] = [];
(globalThis as any).fetch = async (url: string) => {
  const m = String(url).match(/models\/([^:]+):/)![1]; tried.push(m);
  if (m === "gemini-3.8-flash") return new Response(JSON.stringify({ error: { message: "This model is currently experiencing high demand." } }), { status: 503 });
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "ok" }] } }], usageMetadata: {} }), { status: 200 });
};
const fb = await complete("draft", "s", "u", 100);
ok(fb.model === "gemini-3.6-flash" && tried.join(",") === "gemini-3.8-flash,gemini-3.8-flash,gemini-3.6-flash", `busy model retried once, then fell back (${tried.join(" > ")})`);

(globalThis as any).fetch = async () => new Response(JSON.stringify({ error: { message: "Resource exhausted" } }), { status: 429 });
try { await complete("draft", "s", "u", 100); ok(false, "all-busy should throw"); } catch (e: any) { ok(e.message.includes("busy or rate-limited"), "all models busy gives a clear wait-a-minute message"); }
