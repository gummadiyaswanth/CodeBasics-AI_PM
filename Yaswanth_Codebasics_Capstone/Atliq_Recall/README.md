# Recall: sales memory for AtliQ's founder-led sales team

Capstone 1 (AtliQ Sales & CRM Assistant), Step 5 prototype. Author: Yaswanth.

**Live app:** https://code-basics-ai-pm.vercel.app/ (Gemini free tier; if a model is busy it retries, then falls back to the next free Gemini model).

**The problem it solves:** AtliQ has leads; it lacks memory. Client asks, our promises and deadlines arrive on email, WhatsApp, iMessage, Slack, Teams and phone calls, and never reach the Kaizen CRM. Recall reads those conversations, finds every client who is waiting on AtliQ, ranks them by the founders' own rules, drafts the follow-up, and proposes CRM updates for approval. It cites the exact words behind every claim.

## What you can do in the app

| Screen | What it does |
|---|---|
| **Today** | Every client waiting on AtliQ, ranked P1/P2/P3 by urgency, deal value, competition and relationship (the CEO's rules from Client Meeting 2). Wait bar, evidence quote, score breakdown, owner filter, plus "booked and coming up", "log the outcome" and "gone quiet" lists. |
| **Capture** | Pull in items from other channels (WhatsApp, iMessage, Slack, read.ai call summary, voice memo), or paste or dictate anything. Recall extracts asks, promises, dates, budget and competition, each with a verbatim quote. |
| **CRM sync** | Field-level changes for Kaizen (status, value, owner, notes, last contact, next follow-up), each with reason and evidence. Also covers missing leads, duplicates and unlogged cross-sells. Nothing is written without approval. Exports the updated CRM and a change log as CSV. |
| **Accounts** | One timeline per client across channels, a "where we stand" summary built only from sources, and the CRM fields that are stale. |
| **Ask** | Questions like "Where are we with Meridian?". Answers cite sources; if the answer isn't in the conversations, it says so. |
| **How it works** | Eval results, the nine guardrails, and model routing and cost. |

## Architecture

```
 raw sources (email, notes, WhatsApp, iMessage, Slack, call summary, voice memo)
      │  scripts/build-data.ts  strips editorial ground-truth notes, normalises
      ▼
 AI extraction (Gemini 3.5 Flash-Lite free tier, or Claude Haiku 5.5)  ──►  quote check (G1): drop anything not verbatim
      ▼
 signals + account facts ──► deterministic engine (src/lib/engine.ts)
                               • open-loop queue + founder-rule scoring (G5)
                               • last-contact / next-follow-up dates from evidence (G6)
                               • duplicates, CRM health
      ▼
 UI (React) ──► drafts and Q&A (Gemini 3.8 Flash, or Claude Sonnet 5.5; placeholders not guesses: G3/G4/G9)
            ──► CRM changes only after human approval ──► Kaizen CSV + change log (G2)
```

* `api/` holds Vercel serverless functions: `extract`, `draft`, `ask`, `health`. Prompts and schema live in `api/_prompts.ts`.
* `src/lib/engine.ts` contains all ranking, date and CRM logic. No model is involved.
* `src/generated/` holds the dataset as JSON, the seed extraction, seed drafts, eval and grounding reports.
* **Model provider is a setting.** `api/_lib.ts` talks to Gemini (REST, JSON mode with the schema in the prompt) or Claude (tool use). `LLM_PROVIDER` picks one; unset, Gemini wins if `GEMINI_API_KEY` is present. Either way the model output goes through the same quote check, type and date validation, rules and approvals.
* **Prototype runs on Gemini's free tier.** That is fine because the AtliQ dataset is synthetic. Google's pricing page says free-tier content is used to improve its products, so real client messages must go to a paid tier that does not train on them (Claude, or Gemini paid). The PRD records this.
* The sidebar shows whether live AI is on and which models are in use.

## Run it locally

```bash
npm install
npm run dev            # http://localhost:5173 (offline mode; /api needs `vercel dev`)
npm run build          # runs grounding check + eval, then builds
npx vercel dev         # optional: runs the /api functions locally with your key in .env
```

## Deploy to Vercel (free tier)

1. The code lives in `gummadiyaswanth/CodeBasics-AI_PM` under `Yaswanth_Codebasics_Capstone/Atliq_Recall`.
2. In Vercel: **Add New → Project → Import** that repo. Click **Edit** next to **Root Directory** and choose `Yaswanth_Codebasics_Capstone/Atliq_Recall`. The framework preset is Vite; the defaults are fine (build `npm run build`, output `dist`). The `api/` folder becomes serverless functions automatically.
3. Get a free API key at Google AI Studio (aistudio.google.com, "Get API key").
4. In Vercel, under **Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `GEMINI_API_KEY` | your AI Studio key |
   | `LLM_PROVIDER` | `gemini` |

   Never prefix these with `VITE_`; that would ship the key to the browser. Only the `/api` functions read them.
   Optional overrides: `EXTRACT_MODEL` (default `gemini-3.5-flash-lite`), `DRAFT_MODEL` and `ASK_MODEL` (default `gemini-3.8-flash`). For the production plan, set `LLM_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`; defaults become `claude-haiku-5-5` and `claude-sonnet-5-5`.
5. Deploy (or **Redeploy** after adding variables). The sidebar should read "Live AI on" and name the Gemini models.
6. Free-tier limits are per Google Cloud project, per minute and per day (see AI Studio's rate-limit page). If you hit one, the app shows "Gemini free-tier limit reached; wait a minute" and keeps your text.

`npm run test:gemini` checks the Gemini code path against a mocked response (no key needed): JSON parsing, the quote check dropping an invented quote, an unparseable date set to null, and the 429 message.

## Evaluation

`npm run eval` scores the engine against gold labels in `scripts/gold.json`. The labels come from the dataset's italic editorial notes, which the build strips before any AI step.

| Check | Seed extraction |
|---|---|
| Quotes verbatim in source | 152/152 |
| Clients waiting on us (precision / recall) | 100% / 100% (33 accounts) |
| Gone quiet; booked / needs outcome | 100% / 100% |
| Leads missing from CRM; duplicates; reopened lost deals | 6/6; 2/2; 2/2 |
| Founders' own 7 Jul priority list (FinEdge, NovaPharma, ShopSwift, Meridian, HealthFirst) | ranks 1, 2, 8, 11, 10 of 33 |

**An honest caveat.** The seed extraction (`scripts/seed_extraction.py`) was produced by Claude, via Claude Code, with the extraction prompt's rules. It had the whole dataset in view, so the 100% figures measure the engine and the gold labels, not an unseen model run. To score a real model run, use `npm run eval:live` with `GEMINI_API_KEY` in your shell (free; paced at one call every 6 seconds, about 6 minutes for 55 sources) or `ANTHROPIC_API_KEY` (about $0.02 on Haiku 5.5). It re-extracts every source message by message, and scores it. Expect lower precision there: a per-message pass cannot see that a later message closed an earlier promise. That is why closure detection is in the PRD as a v1.1 item.

## Dataset extension

I added five artifacts in `data/extension/`, one per channel the CEO said leads arrive on (Client Meeting 1):

| File | Channel | Why |
|---|---|---|
| `2026-07-08_novapharma_imessage.md` | iMessage | US client chasing on the phone: urgency that never reaches email |
| `2026-07-09_ridgeline_whatsapp.md` | WhatsApp | The Ridgeline caller (3 Jul scribble) resurfaces with contact details |
| `2026-07-07_slack_advisory_referral.md` | Slack Connect | Advisor referral via shared Slack, as described by the CEO |
| `2026-07-09_trustline_readai_summary.md` | Teams + read.ai | Recorded call summary; shows a promise being closed by later evidence |
| `2026-07-10_karandeep_voice_memo.md` | Voice memo | On-the-go call notes dictated while driving (the core pain) |

All are dated before "today" (2026-07-10), consistent with the original files, and use the same `*( ... )*` ground-truth convention.

## Known limits (prototype)

* Channel connectors (Gmail, WhatsApp Business, Slack, Teams/read.ai, phone dictation) are simulated by files. The PRD lists the production integration path.
* Kaizen write-back is a CSV export, because Kaizen's API isn't available to us.
* "Today" is fixed to the dataset date (10 Jul 2026), and demo state lives in your browser (Reset demo clears it).
