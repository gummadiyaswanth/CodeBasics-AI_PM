// Offline eval: runs the engine over an extraction file and scores it against gold labels
// derived from the dataset's editorial notes. Usage:
//   npx tsx scripts/eval.ts                      -> seed extraction
//   npx tsx scripts/eval.ts src/generated/extraction_live.json  -> live model extraction
import fs from "node:fs";
import { Memory, allProcessed } from "../src/lib/engine";

const file = process.argv[2] || "src/generated/extraction.json";
const j = (f: string) => JSON.parse(fs.readFileSync(f, "utf8"));
const gold = j("scripts/gold.json");
const ex = j(file);
const m = new Memory(j("src/generated/crm.json"), j("src/generated/sources.json"), ex, allProcessed(j("src/generated/sources.json")), "2026-07-10");

const prf = (pred: string[], truth: string[]) => {
  const P = new Set(pred), T = new Set(truth);
  const tp = [...P].filter((x) => T.has(x)).length;
  return {
    precision: P.size ? tp / P.size : 1, recall: T.size ? tp / T.size : 1,
    missed: [...T].filter((x) => !P.has(x)), extra: [...P].filter((x) => !T.has(x)),
  };
};

const queue = m.queue();
const rank = (k: string) => queue.findIndex((q) => q.account === k) + 1;
const report = {
  extraction_file: file,
  generated_at: new Date().toISOString(),
  waiting_on_us: prf(queue.map((q) => q.account), Object.keys(gold.waiting_on_us)),
  gone_quiet: prf(m.goneQuiet().map((g) => g.signal.account), gold.gone_quiet),
  scheduled_or_needs_outcome: prf(m.upcoming().map((u) => u.signal.account), [...gold.scheduled, ...gold.needs_outcome]),
  new_leads_not_in_crm: prf(ex.new_leads.map((n: any) => n.account), gold.not_in_crm),
  duplicates: prf(m.duplicates().map((d) => `${d.a.lead_id}/${d.b.lead_id}`), gold.duplicates.map((d: string[]) => d.join("/"))),
  reopened_lost: prf(ex.proposals.filter((p: any) => p.field === "status" && ["L-1007", "L-1015"].includes(p.lead_id)).map((p: any) => p.lead_id), gold.reopened_lost),
  founders_priority_ranks: Object.fromEntries(gold.founders_priority_7jul.map((k: string) => [k, rank(k)])),
  founders_priority_all_in_top: Math.max(...gold.founders_priority_7jul.map(rank)),
  queue_size: queue.length,
  p1_count: queue.filter((q) => q.band === "P1").length,
  grounding: j("src/generated/verify_report.json"),
};
fs.writeFileSync("src/generated/eval_report.json", JSON.stringify(report, null, 2));
const pct = (x: number) => `${Math.round(x * 100)}%`;
console.log(`Waiting-on-us   precision ${pct(report.waiting_on_us.precision)} recall ${pct(report.waiting_on_us.recall)}  missed=${report.waiting_on_us.missed} extra=${report.waiting_on_us.extra}`);
console.log(`Gone quiet      precision ${pct(report.gone_quiet.precision)} recall ${pct(report.gone_quiet.recall)}`);
console.log(`Scheduled/outcome precision ${pct(report.scheduled_or_needs_outcome.precision)} recall ${pct(report.scheduled_or_needs_outcome.recall)}`);
console.log(`New leads       recall ${pct(report.new_leads_not_in_crm.recall)}; duplicates recall ${pct(report.duplicates.recall)}; reopened recall ${pct(report.reopened_lost.recall)}`);
console.log(`Founders' 7 Jul list ranks:`, report.founders_priority_ranks, `(all within top ${report.founders_priority_all_in_top} of ${report.queue_size})`);
console.log(`Grounding: ${report.grounding.checked - report.grounding.failed}/${report.grounding.checked} quotes verbatim`);
