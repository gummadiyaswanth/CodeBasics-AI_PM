import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NO_KEY_MSG, complete, hasKey } from "./_lib.js";
import { DRAFT_SYSTEM } from "./_prompts.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!hasKey()) return res.status(503).json({ error: NO_KEY_MSG });
  const { company, contactName, owner, channel = "email", loops = [], excerpts = [], today } = req.body ?? {};
  const prompt = [
    `Today: ${today}. Account: ${company}. Contact: ${contactName || "unknown"}. Owner (signs the message): ${owner}. Channel: ${channel}.`,
    `Open items we owe them:`,
    ...loops.map((l: any) => `- ${l.summary} (evidence: "${l.quote}"${l.due ? `, due ${l.due}` : ""})`),
    `\nConversation excerpts:`,
    ...excerpts.map((e: any) => `<excerpt id="${e.id}" date="${e.date}">\n${e.body}\n</excerpt>`),
  ].join("\n");
  try {
    const c = await complete("draft", DRAFT_SYSTEM, prompt, 900);
    res.status(200).json({ draft: c.text, model: c.model, provider: c.provider, usage: c.usage });
  } catch (e: any) {
    res.status(502).json({ error: `Model call failed: ${e?.message ?? e}` });
  }
}
