// Prompts and schemas shared by the Vercel functions and scripts/extract-live.ts.
// Provider is chosen by LLM_PROVIDER ("gemini" | "anthropic"); if unset, whichever key is present wins (Gemini first).
export type Provider = "gemini" | "anthropic" | "none";
export function provider(): Provider {
  const p = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (p === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (!p && process.env.GEMINI_API_KEY) return "gemini";
  if (!p && process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "none";
}
const DEFAULTS: Record<Exclude<Provider, "none">, { extract: string; draft: string; ask: string }> = {
  // Prototype default: Gemini free tier (synthetic data only; free-tier content may be used by Google to improve its products).
  gemini: { extract: "gemini-3.5-flash-lite", draft: "gemini-3.8-flash", ask: "gemini-3.8-flash" },
  // Production plan: Claude on a paid API (inputs not used for training).
  anthropic: { extract: "claude-haiku-5-5", draft: "claude-sonnet-5-5", ask: "claude-sonnet-5-5" },
};
export function models() {
  const p = provider();
  const d = p === "none" ? DEFAULTS.gemini : DEFAULTS[p];
  return {
    extract: process.env.EXTRACT_MODEL || d.extract, // high volume, structured extraction
    draft: process.env.DRAFT_MODEL || d.draft, // client-facing writing, low volume
    ask: process.env.ASK_MODEL || d.ask,
  };
}

export const EXTRACT_SYSTEM = `You are the memory layer for AtliQ Technologies' founder-led sales team.
AtliQ people: Bhavin and Dhaval (founders), Karandeep (CEO), Jay (sales), Pranav (CTO), Ayush (AI PM). Everyone else is a client, prospect, partner or referrer.

You read ONE message, note, call summary or voice memo and record every sales signal in it by calling record_signals.

Signal types:
- client_request: the other side asked AtliQ for something (an answer, document, call, quote). waiting_on = "us".
- commitment: an AtliQ person promised to do something. waiting_on = "us".
- deadline: an external date that matters to the deal (board meeting, budget review, decision date).
- meeting: a call or meeting was booked (status "scheduled").
- budget, competitor, cross_sell (a second problem AtliQ could solve), renewal, referral, stakeholder, new_lead, status_signal (deal moved: approved, lost, reopened, cleared), need.

Hard rules:
1. "quote" MUST be copied character-for-character from the input. Never paraphrase inside quote. If you cannot quote it, do not record it.
2. Never invent a date. Set "due" only when the text states or clearly implies one; resolve relative dates ("Tuesday the 14th", "this week", "by Friday") against the message date. Otherwise null.
3. "owner" is the AtliQ person responsible, or null if unclear. Never guess.
4. value_usd only when a number is stated ("~35-40k" -> 37500 with that quote).
5. Do not record personal or sensitive details that are not needed to sell (health, family, personal phone numbers beyond the business contact).
6. If the message contains no sales signal, call record_signals with an empty list.
7. Prefer fewer, accurate signals over many speculative ones.`;

export const SIGNAL_TOOL = {
  name: "record_signals",
  description: "Record the sales signals found in the input.",
  input_schema: {
    type: "object" as const,
    properties: {
      company: { type: "string", description: "Client/prospect company the message is about" },
      contact_name: { type: ["string", "null"] },
      contact_email: { type: ["string", "null"] },
      signals: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["client_request", "commitment", "deadline", "meeting", "budget", "competitor", "cross_sell", "renewal", "referral", "stakeholder", "new_lead", "status_signal", "need"] },
            summary: { type: "string", description: "One sentence, internal-facing" },
            quote: { type: "string", description: "Verbatim span from the input" },
            due: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
            owner: { type: ["string", "null"] },
            waiting_on: { type: ["string", "null"], enum: ["us", "client", null] },
            value_usd: { type: ["number", "null"] },
            competition: { type: ["string", "null"], enum: ["comparable", "much_lower", "favoured", null] },
          },
          required: ["type", "summary", "quote", "due", "owner", "waiting_on", "value_usd"],
        },
      },
    },
    required: ["company", "signals"],
  },
};

// Used when the provider has no tool calling in our integration (Gemini): the schema goes in the prompt,
// the response is forced to JSON, and code validates the shape. The quote check (G1) then runs as usual.
export const JSON_INSTRUCTION = `Return ONLY a JSON object, no prose and no code fences, with this shape:
{"company": string, "contact_name": string|null, "contact_email": string|null,
 "signals": [{"type": one of client_request|commitment|deadline|meeting|budget|competitor|cross_sell|renewal|referral|stakeholder|new_lead|status_signal|need,
   "summary": string, "quote": string (verbatim from the input), "due": "YYYY-MM-DD"|null, "owner": string|null,
   "waiting_on": "us"|"client"|null, "value_usd": number|null, "competition": "comparable"|"much_lower"|"favoured"|null}]}`;

export const DRAFT_SYSTEM = `You draft follow-up messages for AtliQ's founders. The founder reviews and sends; you never send.
Rules:
- Use ONLY facts in the provided conversation excerpts and open items. If an answer is not in the excerpts (a technical answer, a price, a date), write a clearly marked placeholder like [Pranav to confirm: HL7 support] instead of inventing it.
- Never promise a price, discount, delivery date or scope that is not already in the excerpts.
- Acknowledge the delay plainly if the client has waited more than a week; no grovelling.
- Match the channel: email gets a subject line and 80-160 words; WhatsApp/iMessage gets 2-4 short sentences.
- Sign off with the owner's first name.
Return: first line "Subject: ..." (email only), then the body.`;

export const ASK_SYSTEM = `You answer questions about AtliQ's sales pipeline using ONLY the numbered excerpts provided.
Cite every factual sentence with the excerpt id in square brackets, e.g. [2026-06-16_meridian_proposal_questions].
If the excerpts do not contain the answer, say "I can't find that in the conversations I have" and suggest where it might live.
Be brief: 2-6 sentences or a short list. Today is {TODAY}.`;
