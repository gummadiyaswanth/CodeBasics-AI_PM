// Model access for the Vercel functions. One small interface, two providers:
//   Gemini (prototype default, free tier) via REST generateContent, and Claude via the Anthropic SDK.
// Everything that matters for safety (quote check, ranking, approvals) lives outside this file.
import Anthropic from "@anthropic-ai/sdk";
import { EXTRACT_SYSTEM, JSON_INSTRUCTION, SIGNAL_TOOL, models, provider } from "./_prompts.js";

export const hasKey = () => provider() !== "none";
export const NO_KEY_MSG = "No model key on this deployment. Set GEMINI_API_KEY (free tier) or ANTHROPIC_API_KEY in Vercel.";

export interface Usage { input_tokens: number; output_tokens: number }
export interface Completion { text: string; usage: Usage; model: string; provider: string }

const SIGNAL_TYPES = new Set(["client_request", "commitment", "deadline", "meeting", "budget", "competitor", "cross_sell", "renewal", "referral", "stakeholder", "new_lead", "status_signal", "need"]);

// ---------- Gemini (REST, no SDK) ----------
async function gemini(model: string, system: string, user: string, maxTokens: number, json: boolean): Promise<Completion> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2, ...(json ? { responseMimeType: "application/json" } : {}) },
    }),
  });
  const body: any = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = body?.error?.message || `HTTP ${r.status}`;
    if (r.status === 429) throw new Error(`Gemini free-tier limit reached; wait a minute and try again (${msg})`);
    throw new Error(`Gemini: ${msg}`);
  }
  const text = (body?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");
  if (!text) throw new Error(`Gemini returned no text (finish reason: ${body?.candidates?.[0]?.finishReason ?? "unknown"})`);
  const u = body?.usageMetadata ?? {};
  return { text, model, provider: "gemini", usage: { input_tokens: u.promptTokenCount ?? 0, output_tokens: u.candidatesTokenCount ?? 0 } };
}

// ---------- Claude ----------
const anthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
async function claude(model: string, system: string, user: string, maxTokens: number): Promise<Completion> {
  const msg = await anthropic().messages.create({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] });
  const text = msg.content.map((b: any) => (b.type === "text" ? b.text : "")).join("");
  return { text, model, provider: "anthropic", usage: msg.usage as any };
}

/** Free-text completion for drafts and answers. */
export async function complete(kind: "draft" | "ask", system: string, user: string, maxTokens: number): Promise<Completion> {
  const model = models()[kind];
  return provider() === "anthropic" ? claude(model, system, user, maxTokens) : gemini(model, system, user, maxTokens, false);
}

// ---------- extraction ----------
export interface ExtractResult {
  company: string;
  contact_name?: string | null;
  contact_email?: string | null;
  signals: any[];
  dropped: { quote: string; reason: string }[];
  usage: Usage;
  model: string;
  provider: string;
}

// Guardrail G1: drop any signal whose quote is not verbatim in the input, or whose shape is wrong.
export function verifyQuotes(text: string, signals: any[]) {
  const kept: any[] = [];
  const dropped: { quote: string; reason: string }[] = [];
  for (const s of Array.isArray(signals) ? signals : []) {
    if (!s || typeof s !== "object" || !SIGNAL_TYPES.has(s.type)) { dropped.push({ quote: s?.quote ?? "", reason: "unknown signal type" }); continue; }
    if (s.due && !/^\d{4}-\d{2}-\d{2}$/.test(s.due)) s.due = null; // never keep an unparseable date
    if (s.value_usd != null && typeof s.value_usd !== "number") s.value_usd = null;
    if (typeof s.quote === "string" && s.quote && text.includes(s.quote)) kept.push(s);
    else dropped.push({ quote: s.quote, reason: "quote not found verbatim in source" });
  }
  return { kept, dropped };
}

export function parseJson(raw: string): any {
  const t = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(t); } catch { /* fall through */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error("Model did not return valid JSON");
}

export async function extract(text: string, channel: string, date: string, knownAccounts: string[]): Promise<ExtractResult> {
  const model = models().extract;
  const user = `Channel: ${channel}\nMessage date: ${date}\nKnown accounts: ${knownAccounts.join(", ")}\n\n<input>\n${text}\n</input>`;
  let out: any;
  let usage: Usage;
  if (provider() === "anthropic") {
    const msg = await anthropic().messages.create({
      model, max_tokens: 2000, system: EXTRACT_SYSTEM, tools: [SIGNAL_TOOL],
      tool_choice: { type: "tool", name: "record_signals" }, messages: [{ role: "user", content: user }],
    });
    out = (msg.content.find((b) => b.type === "tool_use") as any)?.input ?? { company: "", signals: [] };
    usage = msg.usage as any;
  } else {
    const c = await gemini(model, `${EXTRACT_SYSTEM}\n\n${JSON_INSTRUCTION}`, user, 2000, true);
    out = parseJson(c.text);
    usage = c.usage;
  }
  const { kept, dropped } = verifyQuotes(text, out.signals ?? []);
  return { company: String(out.company ?? ""), contact_name: out.contact_name ?? null, contact_email: out.contact_email ?? null,
    signals: kept, dropped, usage, model, provider: provider() };
}
