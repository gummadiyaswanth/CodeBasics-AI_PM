// Re-runs extraction with the live model over every source (editorial notes already stripped),
// then writes src/generated/extraction_live.json for `npx tsx scripts/eval.ts src/generated/extraction_live.json`.
// Requires GEMINI_API_KEY (free tier) or ANTHROPIC_API_KEY. Gemini free tier: $0, paced to stay under per-minute limits.
// Claude Haiku 5.5: roughly $0.02 for all 55 sources.
import fs from "node:fs";
import { extract, hasKey, NO_KEY_MSG } from "../api/_lib";
import { provider } from "../api/_prompts";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const j = (f: string) => JSON.parse(fs.readFileSync(f, "utf8"));
const sources = j("src/generated/sources.json");
const seed = j("src/generated/extraction.json");
const crm = j("src/generated/crm.json");
const accounts: Record<string, any> = structuredClone(seed.accounts);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function accountKey(company: string, email?: string | null): string {
  const n = norm(company || "");
  for (const [k, a] of Object.entries(accounts)) {
    const c = norm(a.company);
    if (n && (c.startsWith(n.slice(0, 6)) || n.startsWith(c.slice(0, 6)))) return k;
    const dom = email?.split("@")[1];
    if (dom && a.leads.some((l: string) => crm.find((r: any) => r.lead_id === l)?.contact_email?.endsWith(dom))) return k;
  }
  const key = n.slice(0, 12) || "unknown";
  accounts[key] = { company, leads: [], relationship: "inbound", competition: "none_known" };
  return key;
}

async function main() {
  if (!hasKey()) throw new Error(NO_KEY_MSG);
  const pace = provider() === "gemini" ? 6000 : 0; // stay well under free-tier requests-per-minute
  const signals: any[] = [];
  let inTok = 0, outTok = 0, dropped = 0;
  for (const s of sources) {
    let r;
    try {
      r = await extract(s.body, s.channel, s.date, Object.values(accounts).map((a: any) => a.company));
    } catch (e: any) {
      if (!String(e.message).includes("limit")) throw e;
      process.stdout.write(" (rate limit, waiting 60s) ");
      await sleep(60000);
      r = await extract(s.body, s.channel, s.date, Object.values(accounts).map((a: any) => a.company));
    }
    if (pace) await sleep(pace);
    inTok += r.usage.input_tokens; outTok += r.usage.output_tokens; dropped += r.dropped.length;
    const key = accountKey(r.company, r.contact_email);
    for (const x of r.signals) {
      const open = ["client_request", "commitment", "deadline"].includes(x.type) && x.waiting_on === "us";
      signals.push({
        id: `live-${signals.length + 1}`, source: s.id, account: key, type: x.type, summary: x.summary, quote: x.quote,
        raised: s.date, due: x.due, owner: x.owner, value_usd: x.value_usd,
        status: x.type === "meeting" ? "scheduled" : open ? "open" : "info", waiting_on: open ? "us" : null,
      });
    }
    process.stdout.write(".");
  }
  const out = { ...seed, signals, accounts, meta: { today: "2026-07-10", generator: `live ${new Date().toISOString()}` } };
  fs.writeFileSync("src/generated/extraction_live.json", JSON.stringify(out, null, 1));
  console.log(`\n${signals.length} signals, ${dropped} dropped by the quote check, tokens in/out ${inTok}/${outTok}`);
}
main();
