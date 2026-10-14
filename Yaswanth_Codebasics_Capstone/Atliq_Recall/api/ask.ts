import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NO_KEY_MSG, complete, hasKey } from "./_lib.js";
import { ASK_SYSTEM } from "./_prompts.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!hasKey()) return res.status(503).json({ error: NO_KEY_MSG });
  const { question, excerpts = [], today } = req.body ?? {};
  if (!question) return res.status(400).json({ error: "question is required" });
  const ctx = excerpts.map((e: any) => `<excerpt id="${e.id}" date="${e.date}">\n${e.body}\n</excerpt>`).join("\n");
  try {
    const c = await complete("ask", ASK_SYSTEM.replace("{TODAY}", today || ""), `${ctx}\n\nQuestion: ${question}`, 700);
    // Guardrail G9: every citation must point at an excerpt we actually supplied.
    const ids = new Set(excerpts.map((e: any) => e.id));
    const cited = [...c.text.matchAll(/\[([\w-]+)\]/g)].map((m) => m[1]);
    const invalid = cited.filter((x) => !ids.has(x));
    res.status(200).json({ answer: c.text, citations: cited.filter((x) => ids.has(x)), invalid, model: c.model, provider: c.provider, usage: c.usage });
  } catch (e: any) {
    res.status(502).json({ error: `Model call failed: ${e?.message ?? e}` });
  }
}
