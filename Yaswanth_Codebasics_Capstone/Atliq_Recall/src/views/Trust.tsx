import type { Ctx } from "../App";
import { evals } from "../data";

export const GUARDRAILS: [string, string, string][] = [
  ["G1", "Quote or drop it", "Every signal carries the exact words it came from. Code checks the quote appears verbatim in the source; if not, the signal is dropped and never reaches the queue or the CRM."],
  ["G2", "You approve every CRM change", "Nothing is written to Kaizen automatically. AI-suggested status, value, owner and notes are never bulk-approved; low-confidence suggestions are flagged."],
  ["G3", "Recall never sends", "It drafts. You send. The send button stays disabled while any [bracketed] gap is unfilled."],
  ["G4", "Gaps, not guesses", "Drafts and answers use only facts from the conversations. Prices, dates and technical answers that aren't there become brackets for a person to fill."],
  ["G5", "Rules rank, not the model", "Priority uses your own rules (urgency, deal value, competition, relationship) as plain code. Every rank shows its breakdown."],
  ["G6", "Dates come from evidence", "Last-contact and next-follow-up dates are calculated from dated messages, never inferred by the model."],
  ["G7", "Conservative stage changes", "A deal moves to Won only on signature (Trustline stays Proposal Sent while the contract is unsigned). A Lost deal reopens only when the client says so in writing."],
  ["G8", "Minimum context", "Each message is read on its own with only the company list as context. Personal numbers and anything outside selling are not stored. Dataset ground-truth notes are stripped before any AI step."],
  ["G9", "Say when it doesn't know", "Answers cite their sources. Citations that don't match a retrieved conversation are removed, and an empty search says so."],
];

export function TrustView({ ctx }: { ctx: Ctx }) {
  const e = evals;
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return (
    <>
      <h1>How Recall stays grounded.</h1>
      <p className="lede">The AI does one narrow job: read a message and pull out who asked what, what was promised, and by when, with the exact words. Ranking, dates and CRM writes are rules plus your approval.</p>

      <h2>Evaluation on the AtliQ dataset</h2>
      <div className="stats">
        <div className="stat"><b>{e.grounding.checked - e.grounding.failed}/{e.grounding.checked}</b><span className="small muted">quotes found word for word in their source</span></div>
        <div className="stat"><b>{pct(e.waiting_on_us.recall)}</b><span className="small muted">of clients the dataset says were left waiting are in the queue (precision {pct(e.waiting_on_us.precision)})</span></div>
        <div className="stat"><b>Top {e.founders_priority_all_in_top}</b><span className="small muted">of {e.queue_size}: where the founders' own 7 July list (FinEdge, NovaPharma, ShopSwift, Meridian, HealthFirst) ranks</span></div>
        <div className="stat"><b>{pct(e.new_leads_not_in_crm.recall)}</b><span className="small muted">of leads missing from the CRM found; duplicates found {pct(e.duplicates.recall)}</span></div>
      </div>
      <p className="small muted">Gold labels come from the dataset author's editorial notes, which the AI never sees. These scores use the seeded extraction; run <code>npm run eval:live</code> with an API key to score a fresh model run.</p>

      <h2>Guardrails</h2>
      <div className="panel">
        {GUARDRAILS.map(([id, t, d]) => <div className="guard" key={id}><span className="gid">{id}</span><div><b>{t}</b><div className="small">{d}</div></div></div>)}
      </div>

      <h2>Which model does what</h2>
      <div className="panel">
        <table className="diff">
          <thead><tr><th>Job</th><th>Prototype on Vercel</th><th>Production plan</th><th>Why</th></tr></thead>
          <tbody>
            <tr><td>Read a message, extract signals</td><td>Gemini 3.5 Flash-Lite (free tier)</td><td>Claude Haiku 5.5, ~$0.0004 per message</td><td>High volume, structured output, cheapest tier</td></tr>
            <tr><td>Draft a follow-up</td><td>Gemini 3.8 Flash (free tier)</td><td>Claude Sonnet 5.5, ~$0.010 per draft</td><td>Client-facing writing; low volume</td></tr>
            <tr><td>Answer a question</td><td>Gemini 3.8 Flash (free tier)</td><td>Claude Sonnet 5.5, ~$0.011 per answer</td><td>Reasoning over several conversations with citations</td></tr>
            <tr><td>Rank, dates, duplicates, CRM health</td><td>No model</td><td>No model</td><td>Rules are explainable and free</td></tr>
          </tbody>
        </table>
        <p className="small muted">One setting (LLM_PROVIDER) switches providers; the quote check, ranking rules and approvals are the same either way. The prototype uses Gemini's free tier because the AtliQ dataset is synthetic. Google may use free-tier content to improve its products, so real client messages go only to a paid tier that does not train on them. At AtliQ's volume (about 60 messages a day) the paid plan costs roughly $6 a month in model calls.</p>
        {ctx.live && <p className="small">This deployment is live.</p>}
      </div>
      <p className="small muted" style={{ marginTop: 20 }}>Mode: {ctx.live ? "live AI is on for this deployment" : "offline demo (seeded AI output)"}.</p>
    </>
  );
}
