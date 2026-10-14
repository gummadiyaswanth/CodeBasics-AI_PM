import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NO_KEY_MSG, extract, hasKey } from "./_lib.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!hasKey()) return res.status(503).json({ error: NO_KEY_MSG });
  const { text, channel = "capture", date, accounts = [] } = req.body ?? {};
  if (!text || typeof text !== "string" || text.length > 20000) return res.status(400).json({ error: "text is required (max 20,000 chars)" });
  try {
    const out = await extract(text, channel, date || new Date().toISOString().slice(0, 10), accounts);
    res.status(200).json(out);
  } catch (e: any) {
    res.status(502).json({ error: `Model call failed: ${e?.message ?? e}` });
  }
}
